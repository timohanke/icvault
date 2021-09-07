import Principal "mo:base/Principal";
import Text "mo:base/Text";
import List "mo:base/List";
import Array "mo:base/Array";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";

actor class KeySync() { 

    public type PublicKey = Text;
    public type DeviceAlias = Text;
    public type Ciphertext = Text;
  
    public type DeviceList = Map.HashMap<DeviceAlias, PublicKey>;
    public type CiphertextList = Map.HashMap<PublicKey, Ciphertext>;
  
    public type UserStore = { 
        device_list : DeviceList;
        ciphertext_list : CiphertextList;
    };
  
    // List D of devices 
    var users = Map.HashMap<Principal, UserStore>(10, Principal.equal, Principal.hash);
  
    public shared(message) func register_device(alias : DeviceAlias, pk : PublicKey) : async Bool {
        let caller = message.caller;
      
        // if caller unknown then create empty lists for user
        switch (users.get(caller)) {
            case null { 
                let empty_store = { 
                    device_list = Map.HashMap<DeviceAlias, PublicKey>(10, Text.equal, Text.hash); 
                    ciphertext_list = Map.HashMap<PublicKey, Ciphertext>(10, Text.equal, Text.hash); 
                    };
                users.put(caller, empty_store); 
            }; 
            case (?device_list) { }
        };
    
        // get caller's device list and add
        switch (users.get(caller)) {
            case null { 
                assert false;
                return false; 
            }; 
            case (?store) { 
                switch (store.device_list.get(alias)) {
                    case null {
                        store.device_list.put(alias, pk);
                        return true;
                    };
                    case (?existing_alias) { 
                        return false;
                    }
                };
            }
        };
    };
  
    public shared(message) func remove_device(alias : DeviceAlias) : async () {
        let caller = message.caller;
      
        // if caller has no device list yet then create an empty list
        switch (users.get(caller)) {
            case null {  }; 
            case (?store) { 
                store.device_list.delete(alias);
            }
        };   
    };
  
    public shared(message) func get_devices() : async [(DeviceAlias, PublicKey)] {
        let caller = message.caller;
        switch (users.get(caller)) {
          case null {
              return [];
          };
          case (?store) {
              return Iter.toArray(store.device_list.entries());
          };  
        };
    };
  
    // List M of ciphertexts
  
    public shared(message) func get_unsynced_pubkeys() : async [PublicKey] {
        switch (users.get(message.caller)) {
            case null { 
                return []
             }; 
            case (?store) { 
                var return_list : [PublicKey] = [];
                for (x in store.device_list.entries()) {
                    let pk : PublicKey = x.1;
                    switch (store.ciphertext_list.get(pk)) {
                        case null {
                            return_list := Array.append<PublicKey>(return_list, [pk]);
                        };
                        case (?dummy) { }
                    }
                };
                return_list           
            }
        };   
    }; 

    public shared(message) func isSeeded() : async Bool {
        switch (users.get(message.caller)) {
            case null { 
                return false
            }; 
            case (?store) { 
                return (store.ciphertext_list.size() > 0);
            }
        }   
    };

    // Return the principal identifier of the caller of this method.
    public shared (message) func whoami() : async Principal {
        return message.caller;
    };
}
