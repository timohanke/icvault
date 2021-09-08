import Map "mo:base/HashMap";
import Text "mo:base/Text";
import List "mo:base/List";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";

// This actor provides basic key-value store functionality.
// Each user can access and identify its own key-value data, using the user's
// principal ID to identify the user.
actor {

  // New types for keys and values.
  type Key = Text;
  type Value = Text;

  // New types for the KV store and KV entries.
  type KVStore = Map.HashMap<Key, Value>;
  type KVEntry = {
      key : Key;
      value: Value;
  };

  // New type for an array of KV entries associated with a specific principal ID.
  type PrincipaledKVArray = {
      principal : Principal;
      kvstore: [KVEntry];
  };

  // The main map storing the KV store for each principal.
  var main_map = Map.HashMap<Principal, KVStore>(0, Principal.equal,  Principal.hash);

  // Since hashmaps cannot be declared "stable", an array is used to cache the
  // entries in the main map for canister upgrades.
  stable var entries : [(Principal, [(Key, Value)])] = [];

  // The function inserts the given key-value pair, associated with the
  // principal ID of the sender of the message.
  public shared(msg) func insert(key: Key, value: Value): async () {
      // Extract the principal ID of the caller.
      var option = main_map.get(msg.caller);
      switch (option) {
          case null {
              // If there is no entry for this principal ID, create one.
              var map  = Map.HashMap<Key, Value>(0, Text.equal,  Text.hash);
              map.put(key, value);
              main_map.put(msg.caller, map)
          };
          case (?map) {
              // Otherwise, add the key-pair for the given principal ID.
              map.put(key, value);
          };
      };
  };

  // The function returns the value for the given key associated with the
  // caller's principal ID, if available.
  public query(msg) func lookup(key : Key) : async ?Value {
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

  // This is a helper function to map a key-value pair to a KVEntry.
  func to_KVEntry((key: Key, value: Value)) : KVEntry {
      {key = key; value = value;}
  };

  // The function returns the key-value pairs associated with the caller's
  // principal ID, if available.
  public query(msg) func get_kvstore() : async [KVEntry] {
      var option = main_map.get(msg.caller);
      switch (option) {
          case (?map) {
            let x = Iter.toArray(map.entries());
            Array.map(x,to_KVEntry)
          };
          case null {
              []
          };
      };
  };

  // The function deletes the entry for the given key in the caller's
  // key-value store, if available.
  public shared(msg) func delete(key : Key) : async () {
      var option = main_map.get(msg.caller);
      switch (option) {
          case (?map) {
            map.delete(key)
          };
          case null {
              // Ignored as there is no entry for the user's principal ID.
          };
      };
  };

  // This system function is called before upgrading the canister.
  // The function stores the main map in the persistent array of entries.
  system func preupgrade() {
      entries := [];
      // For each principal ID, add the tuple consisting of the principal ID
      // and the array of key-value pairs.
      for ((principal, map) in main_map.entries()) {
          var a = [(principal, Iter.toArray(map.entries()))];
          entries := Array.append(entries, a);
      }
  };

  // This system function is called after upgrading the canister.
  // The function restores the main map from the persistent array of entries.
  system func postupgrade() {
      // Instantiate a new map.
      main_map := Map.HashMap<Principal, KVStore>(0, Principal.equal,  Principal.hash);
      // Insert the map of key-value pairs for each prinicipal.
      for ((principal, array) in entries.vals()) {
          main_map.put(principal, Map.fromIter(array.vals(), 0,  Text.equal, Text.hash));
      }
  };

  // This is a helper function that converts a principal ID and the associated
  // list of key-value pairs into a PrincipaledKVArray.
  func to_principaled_kv_array((p : Principal, kvs : [(Key, Value)])) : PrincipaledKVArray {
      {principal = p; kvstore = Array.map(kvs, to_KVEntry)}
  };

   // **************************************************************************
   // This function is for demo purposes only!
   // The function "leaks" all information that is stored in the canister.
   // This leak is not critical as all stored information is encrypted.
   public query func leak() : async [PrincipaledKVArray] {
        Array.map(entries,to_principaled_kv_array)
   };
};
