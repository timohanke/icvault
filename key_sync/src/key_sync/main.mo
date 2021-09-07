import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Option "mo:base/Option";

actor class KeySync() {

    public type PublicKey = Text;
    public type DeviceAlias = Text;
    public type Ciphertext = Text;
    public type GetCiphertextError = { #notFound; #notSynced };

    type UserStore = {
        device_list : Map.HashMap<DeviceAlias, PublicKey>;
        ciphertext_list : Map.HashMap<PublicKey, Ciphertext>;
    };

    func UserStore() : UserStore {
        return {
            device_list = Map.HashMap<DeviceAlias, PublicKey>(10, Text.equal, Text.hash);
            ciphertext_list = Map.HashMap<PublicKey, Ciphertext>(10, Text.equal, Text.hash);
        }
    };

    let users = Map.HashMap<Principal, UserStore>(10, Principal.equal, Principal.hash);

    public shared (message) func register_device(alias : DeviceAlias, pk : PublicKey) : async Bool {
        let caller = message.caller;

        // if caller unknown then create empty lists for user
        if (Option.isNull(users.get(caller))) {
            users.put(caller, UserStore());
        };

        // get caller's device list and add
        switch (users.get(caller)) {
            case null {
                assert false // case null cannot happen
            };
            case (?store) {
                if (Option.isSome(store.device_list.get(alias))) {
                    return false
                };
                store.device_list.put(alias, pk);
            }
        };
        true
    };

    public shared(message) func remove_device(alias : DeviceAlias) : () {
        switch (users.get(message.caller)) {
            case null { };
            case (?store) {
                // remove ciphertexts associated with the device
                switch (store.device_list.get(alias)) {
                    case null { };
                    case (?pk) {
                        store.ciphertext_list.delete(pk)
                    }
                };
                // remove the device
                store.device_list.delete(alias);
            }
        }
    };

    public query (message) func get_devices() : async [(DeviceAlias, PublicKey)] {
        switch (users.get(message.caller)) {
            case null {
                []
            };
            case (?store) {
                Iter.toArray(store.device_list.entries())
            }
        }
    };

    public query (message) func get_unsynced_pubkeys() : async [PublicKey] {
        switch (users.get(message.caller)) {
            case null {
                []
             };
            case (?store) {
                let a = Iter.toArray(store.device_list.entries());
                func f(x : (DeviceAlias, PublicKey)) : ?PublicKey {
                    switch (store.ciphertext_list.get(x.1)) {
                        case null { ?x.1 };
                        case (?c) { null } 
                    }
                };
                Array.mapFilter(a, f);
            }
        };
    };

    public query (message) func isSeeded() : async Bool {
        switch (users.get(message.caller)) {
            case null {
                false
            };
            case (?store) {
                (store.ciphertext_list.size() > 0);
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

    public query (message) func get_ciphertext(pk : PublicKey) : async Result.Result<Ciphertext, GetCiphertextError> {
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
            case null { }; // user unknown
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

    public shared(message) func seed(pk : PublicKey, c : Ciphertext) : () {
        switch (users.get(message.caller)) {
            case null { }; // user unknown
            case (?store) {
                if (isKnownPublicKey(store, pk) and store.ciphertext_list.size() == 0) {
                    store.ciphertext_list.put(pk, c)
                }
            }
        }            
    };

    // Return the principal identifier of the caller of this method.
    public query (message) func whoami() : async Principal {
        return message.caller;
    };
}
