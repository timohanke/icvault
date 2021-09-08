import Map "mo:base/HashMap";
import Text "mo:base/Text";
import List "mo:base/List";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";

actor {

  type Key = Text;

  type Value = Text;

  type KVStore = Map.HashMap<Key, Value>;
  
  var main_map = Map.HashMap<Principal, KVStore>(0, Principal.equal,  Principal.hash);

  public shared(msg) func insert(key: Key, value: Value): async () {
      var option = main_map.get(msg.caller);
      switch (option) {
          case null {
              var map  = Map.HashMap<Key, Value>(0, Text.equal,  Text.hash);
              map.put(key, value); 
              main_map.put(msg.caller, map) 
          };
          case (?map) {
              map.put(key, value);
              main_map.put(msg.caller, map)
          };
      }; 
  };

  // requires deterministic encryption!
  public shared(msg) func lookup(key : Key) : async ?Value {
      var option = main_map.get(msg.caller);
      switch (option) {
          case (?map) {
            map.get(key)
          };
          case null {
              null
          };
      };
  };

  public shared(msg) func get_kvstore() : async [(Key, Value)] {
      var option = main_map.get(msg.caller);
      switch (option) {
          case (?map) {
            Iter.toArray(map.entries())
          };
          case null {
              []
          };
      };
    
  };

  public shared(msg) func delete(key : Key) : async () {
      var option = main_map.get(msg.caller);
      switch (option) {
          case (?map) {
            map.delete(key)
          };
          case null {
              // error processing missing
          };
      };
  };

  public shared(msg) func replace(key : Key, value: Value) : async ?Value {
      var option = main_map.get(msg.caller);
      switch (option) {
          case (?map) {
              map.replace(key, value)
          };
          case null {
              null
              // error processing missing
          };
      };
  };

  stable var entries : [(Principal, [(Key, Value)])] = [];
  system func preupgrade() {
      entries := [];
      for ((principal, map) in main_map.entries()) {
          var a = [(principal, Iter.toArray(map.entries()))];
          entries := Array.append(entries, a);
      }
  };

  system func postupgrade() {
      main_map := Map.HashMap<Principal, KVStore>(0, Principal.equal,  Principal.hash);
      for ((principal, array) in entries.vals()) {
          main_map.put(principal, Map.fromIter(array.vals(), 0,  Text.equal, Text.hash));
      }
  };

   // for demo purposes only, 
   // to show that no real information is leaked because everything is encrypted 
   // returns [] if called before first upgrade
   public query func leak() : async [(Principal, [(Key, Value)])] {
     return entries;
   };
};
