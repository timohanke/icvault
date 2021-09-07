import Map "mo:base/HashMap";
import Text "mo:base/Text";
import List "mo:base/List";
import Iter "mo:base/Iter";

actor {

  type ApplicationName = Text;

  type Credential = {
    username: Text;
    password: Text;
  };

  stable var entries : [(ApplicationName, Credential)] = [];
  var credential_map = Map.HashMap<ApplicationName, Credential>(0, Text.equal, Text.hash);

  public func insert(application : ApplicationName, credential : Credential): async () {
    credential_map.put(application, credential);
  };

  // requires deterministic encryption!
  public query func lookup(application : ApplicationName) : async ?Credential {
    credential_map.get(application)
  };

  public query func get_credentials() : async [(ApplicationName, Credential)] {
    Iter.toArray(credential_map.entries())
  };

  system func preupgrade() {
    entries := Iter.toArray(credential_map.entries());
  };

  system func postupgrade() {
    credential_map := Map.fromIter(entries.vals(), 0,  Text.equal, Text.hash);
  };
};
