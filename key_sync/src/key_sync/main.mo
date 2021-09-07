import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";

actor class KeySync() {

    public type PublicKey = Text;
    public type DeviceAlias = Text;
    public type Ciphertext = Text;
    public type GetCiphertextError = { #notFound; #notSynced };

    type DeviceList = Map.HashMap<DeviceAlias, PublicKey>;
    type CiphertextList = Map.HashMap<PublicKey, Ciphertext>;

    type UserStore = {
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

    public shared(message) func remove_device(alias : DeviceAlias) : async Bool {
        switch (users.get(message.caller)) {
            case null { 
                false // unknown user
             };
            case (?store) {
                // remove ciphertexts associated with the device
                switch (store.device_list.get(alias)) {
                    case null { 
                        return false // unknown alias
                    };
                    case (?pk) {
                        store.ciphertext_list.delete(pk)
                    }
                };
                // remove the device
                store.device_list.delete(alias);
                true
            }
        }
    };

    public shared query (message) func get_devices() : async [(DeviceAlias, PublicKey)] {
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

    public shared query (message) func get_unsynced_pubkeys() : async [PublicKey] {
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

    public shared query (message) func isSeeded() : async Bool {
        switch (users.get(message.caller)) {
            case null {
                return false
            };
            case (?store) {
                return (store.ciphertext_list.size() > 0);
            }
        }
    };

    func isKnownPublicKey(store : UserStore, pk : PublicKey) : Bool {
        var found = false;
        for (x in store.device_list.entries()) {
            if (x.1 == pk) { 
                return true;
            }
        };
        false
    };

    public shared query (message) func get_ciphertext(pk : PublicKey) : async Result.Result<Ciphertext, GetCiphertextError> {
        switch (users.get(message.caller)) {
            case null {
                #err(#notFound) // user unknown
            };
            case (?store) {
                if (not isKnownPublicKey(store, pk)) {
                    return #err(#notFound) // pk unknown
                };
                switch (store.ciphertext_list.get(pk)) {
                    case null {
                        #err(#notSynced)
                    };
                    case (?ciphertext) {
                        #ok(ciphertext)
                    }
                };
            }
        }        
    };

    public shared(message) func submit_ciphertexts(ciphertexts : [(PublicKey, Ciphertext)]) : () {
        switch (users.get(message.caller)) {
            case null {
                // user unknown
            };
            case (?store) {
                label next for (x in ciphertexts.vals()) {
                    let pk = x.0;
                    if (not isKnownPublicKey(store, pk)) {
                        continue next
                    };
                    switch (store.ciphertext_list.get(pk)) {
                        case (?dummy) {
                            continue next
                        };
                        case null {
                            store.ciphertext_list.put(pk, x.1)
                        }
                    }
                }
            }
        }            
    };

    // Return the principal identifier of the caller of this method.
    public shared query (message) func whoami() : async Principal {
        return message.caller;
    };
}
