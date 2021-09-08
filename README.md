# IC Vault
In order to support Dapps handling sensitive data we need seamless end-to-end encryption to ensure that the IC does not get to see any cleartext. As example IC Vault enables the management of key value pairs linked to a location or application. IC Vault focuses on the transparent access of managed data by all registered devices of a specific user. Thereby, it is assumed that the devices is added to the user’s Internet Identity. We leverage this fact and thereby demonstrate the power of Internet Identity. By “seamless” we mean that no additional communication between the devices is required, i.e. no scanning of QR codes by one device on another, etc. Each device only communicates directly with the IC. 

![IC Vault](resources/overview.png)

# Deployment

IC Vault is decomposed into the following components:

* UI is located in [frontend](/frontend)
* Managment of devices is handeld by the Motoko [key_sync](/key_sync) canister 
* Storage of sensitive data is handeld by the [kv_store](/kv_store) canister
* Assets of the frontend are provided by the kv_store_assets caniser

Each of the main folders ([frontend](/frontend), [key_sync](/key_sync) and [kv_store](/kv_store)) provides a Makefile to build and deploy the individiual components. 

# How to use it

The IC Vault front page defines the basic workflow. The following steps have to be performed during first use:
* The user needs to sign into the IC. 
* Next, the user registers a device. (More devices can be registered as needed.) This results in generating a public keypair. The secret key together with a nickname is stored in the local storage of the browser.  
* A shared secret is seeded which is encrypted via the public key of the device and handed over to the key_sync canister. 

Futher details can be found in the design document (see below).

On consecutive accesses to the IC Vault the user needs to sign into the IC and when using a registered device the sensitive data can be seamlessly accessed.  

# Documentation

https://docs.google.com/document/d/1dUvzQBKNM9COXPXw-mWnmXQOhwSdrSA2QRuefnYCnaU/edit#heading=h.tfzfyr8zn3o2
