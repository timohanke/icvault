# IC Vault
In order to support Dapps handling sensitive data we need seamless end-to-end encryption to ensure that the IC does not get to see any cleartext. As example IC Vault enables the management of key value pairs linked to a location or application. IC Vault focuses on the transparent access of managed data by all registered devices of a specific user. Thereby, it is assumed that the devices is added to the user’s Internet Identity. We leverage this fact and thereby demonstrate the power of Internet Identity. By “seamless” we mean that no additional communication between the devices is required, i.e. no scanning of QR codes by one device on another, etc. Each device only communicates directly with the IC. 

# Deployment

IC Vault is decomposed into the following components:

* UI is located in [frontend](/frontend)
* Managment of devices is handeld by the Motoko [key_sync](/kv_store) canister 
* Storage of sensitive data is handeld by the [kv_store](/kv_store) canister
* Assets of the frontend are provided by the kv_store_assets caniser

TODO

# How to use it

TODO 

# Documentation

https://docs.google.com/document/d/1dUvzQBKNM9COXPXw-mWnmXQOhwSdrSA2QRuefnYCnaU/edit#heading=h.tfzfyr8zn3o2
