# IC Vault
In order to support Dapps handling sensitive data, we need seamless end-to-end encryption to ensure that the IC does not get to see any confidential or private data.

The `IC Vault` enables the management of key-value pairs linked to a location or application. The `IC Vault` focuses on the transparent access of managed data by all registered devices of a specific user. It is assumed that the devices are added to the user’s Internet Identity. We leverage this fact and thereby demonstrate the power of Internet Identity. By "seamless" we mean that no additional communication between the devices is required, i.e., no scanning of QR codes by one device on another, etc. Each device only communicates directly with the IC. 

![IC Vault](resources/overview.png)

The figure above illustrates the main steps. After logging in, the user can get the symmetric key for a specific application from the `Key Sync Canister`. This symmetric key is encrypted with the user's public key. After decrypting the symmetric key with the user's private key, the encrypted value for a certain key is requested from the `KV Store Canister`. The value can then be obtained by using the symmetric key to decrypt the value.
Note that the key itself is also encrypted using the same symmetric key so that the `KV Store Canister` does not learn the keys, either.

# Deployment

`IC Vault` is decomposed into the following components:

* The UI is located in [frontend](/frontend)
* The managment of devices is handled by the Motoko `Key Sync Canister` in the folder [key_sync](/key_sync)
* Storage of sensitive data is handled by the Motoko `KV Store Canister` in the folder [kv_store](/kv_store)
* Assets of the frontend are provided by the kv_store_assets canister

Each of the main folders ([frontend](/frontend), [key_sync](/key_sync) and [kv_store](/kv_store)) provides a `Makefile` to build and deploy the individiual components. 

# How to use it

The `IC Vault` front page defines the basic workflow. The following steps have to be performed during first use:
* The user needs to sign into the IC. 
* Next, the user registers a device (more devices can be registered as needed). As a result, a public-private key pair is generated. The private key together with a nickname is stored in the local storage of the browser.  
* A shared secret is created, which is encrypted with the public key of the device and handed over to the key_sync canister. 

Futher details can be found in the design document (see below).

On consecutive accesses to the `IC Vault`, the user needs to sign into the IC using his or her Internet Identity. When using a registered device, the sensitive data can be accessed and displayed seamlessly.

# Documentation

Additional documentation is provided in the [linked document](https://docs.google.com/document/d/1dUvzQBKNM9COXPXw-mWnmXQOhwSdrSA2QRuefnYCnaU/edit#heading=h.tfzfyr8zn3o2).
