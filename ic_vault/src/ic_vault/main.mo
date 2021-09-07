import Map "mo:base/HashMap";
import Text "mo:base/Text";
import List "mo:base/List";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";

actor {

  type ApplicationName = Text;

  type Credential = {
    username: Text;
    password: Text;
  };

  type CredentialMap = Map.HashMap<ApplicationName, Credential>;

  var vault_map = Map.HashMap<Principal, CredentialMap>(0, Principal.equal,  Principal.hash);

  public shared(msg) func insert(application : ApplicationName, credential : Credential): async () {
      var option = vault_map.get(msg.caller);
      switch (option) {
          case null {
              var map  = Map.HashMap<ApplicationName, Credential>(0, Text.equal,  Text.hash);
              map.put(application, credential);
              vault_map.put(msg.caller, map)
          };
          case (?map) {
              map.put(application, credential);
              vault_map.put(msg.caller, map)
          };
      };
  };

  // requires deterministic encryption!
  public shared(msg) func lookup(application : ApplicationName) : async ?Credential {
      var option = vault_map.get(msg.caller);
      switch (option) {
          case (?map) {
            map.get(application)
          };
          case null {
              null
          };
      };
  };

  public shared(msg) func get_credentials() : async [(ApplicationName, Credential)] {
      var option = vault_map.get(msg.caller);
      switch (option) {
          case (?map) {
            Iter.toArray(map.entries())
          };
          case null {
              []
          };
      };

  };

  stable var entries : [(Principal, [(ApplicationName, Credential)])] = [];
  system func preupgrade() {
      entries := [];
      for ((principal, map) in vault_map.entries()) {
          var a = [(principal, Iter.toArray(map.entries()))];
          entries := Array.append(entries, a);
      }
  };

  system func postupgrade() {
      vault_map := Map.HashMap<Principal, CredentialMap>(0, Principal.equal,  Principal.hash);
      for ((principal, array) in entries.vals()) {
          vault_map.put(principal, Map.fromIter(array.vals(), 0,  Text.equal, Text.hash));
      }
  };
};
