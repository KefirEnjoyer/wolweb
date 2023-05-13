package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strconv"
)

func loadData() {

	devicesFile, err := os.Open("devices.json")
	if err != nil {
		log.Fatalf("Error loading devices.json file. \"%s\"", err)
	}
	devicesDecoder := json.NewDecoder(devicesFile)
	err = devicesDecoder.Decode(&appData)
	if err != nil {
		log.Fatalf("Error decoding devices.json file. \"%s\"", err)
	}
	log.Printf("Application data loaded from devices.json")
	log.Println(" - devices defined in devices.json: ", len(appData.Devices))

}

func saveData(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")
	var result HTTPResponseObject

	log.Printf("New Application data received for saving to disk")
	err := json.NewDecoder(r.Body).Decode(&appData)
	if err != nil {
		// http.Error(w, err.Error(), http.StatusBadRequest)
		result.Success = false
		result.Message = "Colud not save the data. " + err.Error()
		result.ErrorObject = err
		log.Printf(" - Issues decoding/saving application data")
	} else {
		file, _ := os.OpenFile("devices.json", os.O_RDWR|os.O_CREATE|os.O_TRUNC, os.ModePerm)
		defer file.Close()

		encoder := json.NewEncoder(file)
		encoder.SetIndent("", "    ")
		encoder.Encode(appData)

		result.Success = true
		result.Message = "devices data saved to devices.json file. There are now " + strconv.Itoa(len(appData.Devices)) + " device defined in the list."
		log.Printf(" - New application data saved to file devices.json")
	}
	json.NewEncoder(w).Encode(result)

}

func getData(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(appData)
	log.Printf("Request for Application data served")

}

func ping(device Device, ch chan<- Device) {

	_, err := exec.Command("ping", "-c", "1", device.AddressIP).Output()
	if err != nil {
		ch <- Device{Connection: "off", AddressIP: device.AddressIP, Name: device.Name, Mac: device.Mac, BroadcastIP: device.BroadcastIP}
	} else {
		ch <- Device{Connection: "on", AddressIP: device.AddressIP, Name: device.Name, Mac: device.Mac, BroadcastIP: device.BroadcastIP}
	}

}
func updateConnectionsData(w http.ResponseWriter, r *http.Request) {

	var result AppData
	ch := make(chan Device)
	for _, device := range appData.Devices {
		go ping(device, ch)
	}
	for range appData.Devices {
		result.Devices = append(result.Devices, <-ch)
	}
	log.Print(result)
	jsonData, err := json.Marshal(result)
	if err != nil {
		log.Fatal(err)
	}
	// write the JSON data to a file
	err = ioutil.WriteFile("devices.json", jsonData, 0644)
	if err != nil {
		log.Fatal(err)
	}
	loadData()
	fmt.Fprintf(w, "data Refreshed!")

}
