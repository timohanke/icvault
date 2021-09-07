import Principal "mo:base/Principal";
import Text "mo:base/Text";
import L "mo:base/List";
import A "mo:base/AssocList";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";

shared (install) actor class KeySync() { 

  public type PublicKey = Text;
  public type DeviceAlias = Text;
  public type DeviceList = Map.HashMap<DeviceAlias, PublicKey>;
  
  var hmap = Map.HashMap<Principal, DeviceList>(10, Principal.equal, Principal.hash);

  public shared(message) func register_device(alias : DeviceAlias, pk : PublicKey) : async () {
    let caller = message.caller;
  
    // if caller has no device list yet then create an empty list
    switch (hmap.get(caller)) {
        case null { 
            hmap.put(caller, Map.HashMap<DeviceAlias, PublicKey>(10, Text.equal, Text.hash)); 
        }; 
        case (?device_list) { }
    };

    // get caller's device list
    switch (hmap.get(caller)) {
        case null { }; // should not occurr
        case (?device_list) { // type DeviceList
            device_list.put(alias, pk);
        }
    }
  };

  public shared(message) func get_devices() : async [(DeviceAlias, PublicKey)] {
    let caller = message.caller;
    switch (hmap.get(caller)) {
      case null {
          return [];
      };
      case (?device_list) {
          return Iter.toArray(device_list.entries());
      };  
    };
  };

  // Return the principal identifier of the caller of this method.
  public shared (message) func whoami() : async Principal {
    return message.caller;
  };
};
