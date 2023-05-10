package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
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
	out, err := exec.Command("ping", "-c", "1", device.AddressIP).Output()
	if err != nil {

		ch <- Device{Connection: false, AddressIP: device.AddressIP, Name: device.Name, Mac: device.Mac, BroadcastIP: device.BroadcastIP}
		return
	}
	if strings.Contains(string(out), "1 received") {
		ch <- Device{Connection: false, AddressIP: device.AddressIP, Name: device.Name, Mac: device.Mac, BroadcastIP: device.BroadcastIP}
	}
}
func updateConnectionsData() {
	var results AppData
	ch := make(chan Device)
	for _, device := range appData.Devices {
		go ping(device, ch)
	}
	for range appData.Devices {
		results.Devices = append(appData.Devices, <-ch)
	}
	jsonData, err := json.Marshal(results)
	if err != nil {
		log.Fatal(err)
	}
	file, err := os.OpenFile("devices.json", os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()
	_, err = file.Write(jsonData)
	if err != nil {
		log.Fatal(err)
	}
	//getData()
}
