package main

//HTTPResponseObject Data structure for sending the API call status
type HTTPResponseObject struct {
	Success     bool   `json:"success"`
	Message     string `json:"message"`
	ErrorObject error  `json:"error"`
}

// Device represents a Computer Object
type Device struct {
	Connection  bool   `json:"connection"`
	Name        string `json:"name"`
	Mac         string `json:"mac"`
	BroadcastIP string `json:"ip"`
	AddressIP   string `json:"address"`
}

// AppData is list of Computer objects defined in JSON config file
type AppData struct {
	Devices []Device `json:"devices"`
}

// AppConfig represents a configuration object to initialize this application
type AppConfig struct {
	Port    int    `json:"port" env:"WOLWEBPORT" env-default:"8089"`
	VDir    string `json:"vdir" env:"WOLWEBVDIR" env-default:"/wolweb"`
	BCastIP string `json:"bcastip" env:"WOLWEBBCASTIP" env-default:"192.168.1.255:9"`
}
