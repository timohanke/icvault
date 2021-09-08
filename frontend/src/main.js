import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';

const signInBtn = document.getElementById('signinBtn');
const signOutBtn = document.getElementById('signoutBtn');
const whoamiBtn = document.getElementById('whoamiBtn');
const hostUrlEl = document.getElementById('hostUrl');
const whoAmIResponseEl = document.getElementById('whoamiResponse');
const principalEl = document.getElementById('principal');
const registerDeviceEl = document.getElementById('registerDeviceResponse');
const deviceAliasEl = document.getElementById('deviceAlias');

const keySyncCanister = "khpze-daaaa-aaaai-aal6q-cai";
const vaultCanister = "uvf7r-liaaa-aaaah-qabnq-cai";

let authClient;

var myKeyPair = "";
var myPublicKey = "";

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

const init = async () => {
  authClient = await AuthClient.create();
  principalEl.innerText = await authClient.getIdentity().getPrincipal();

  // Redirect to the identity provider
  signInBtn.onclick = async () => {
    authClient.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: async () => {
        principalEl.innerText = await authClient.getIdentity().getPrincipal();
      },
    });
  };

  signOutBtn.onclick = async () => {
    authClient.logout();
  };

  // generate new keypair for this device/window
  // TODO: check in local storage first
  window.myKeyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-384"
    },
    true,
    ["sign", "verify"]
    );

  const exported = await window.crypto.subtle.exportKey('spki', window.myKeyPair.publicKey);
  const exportedAsString = ab2str(exported);
  const exportedAsBase64 = window.btoa(exportedAsString);
  window.myPublicKeyString = exportedAsBase64;

};

init();

whoamiBtn.addEventListener('click', async () => {
  const identity = await authClient.getIdentity();

  // We either have an Agent with an anonymous identity (not authenticated),
  // or already authenticated agent, or parsing the redirect from window.location.
  const idlFactory = ({ IDL }) =>
    IDL.Service({
      whoami: IDL.Func([], [IDL.Principal], ['update']),
    });

  const canisterId = Principal.fromText(keySyncCanister);

  const actor = Actor.createActor(idlFactory, {
    agent: new HttpAgent({
      host: "https://ic0.app/",
      identity,
    }),
    canisterId,
  });

  whoAmIResponseEl.innerText = 'Loading...';

  // Similar to the sample project on dfx new:
  actor.whoami().then(principal => {
    whoAmIResponseEl.innerText = principal.toText();
  });
});

registerDeviceBtn.addEventListener('click', async () => {
  const identity = await authClient.getIdentity();

  // We either have an Agent with an anonymous identity (not authenticated),
  // or already authenticated agent, or parsing the redirect from window.location.
  const idlFactory = ({ IDL }) =>
    IDL.Service({
      register_device: IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], ['update']),
    });

  const canisterId = Principal.fromText(keySyncCanister);

  const actor = Actor.createActor(idlFactory, {
    agent: new HttpAgent({
      host: "https://ic0.app/",
      identity,
    }),
    canisterId,
  });

  registerDeviceEl.innerText = 'Loading...';

  actor.register_device(deviceAliasEl.value, window.myPublicKeyString).then(result => {
    registerDeviceEl.innerText = result;
  });
});

function call_insert(identity, key, user, pw) {
    const idlFactory = ({ IDL }) =>
        IDL.Service({
        insert:
            IDL.Func([IDL.Text, IDL.Text], [], ['update']),
        get_kvstore:
            IDL.Func([], [IDL.Vec(IDL.Record({"key": IDL.Text, "value": IDL.Text}))], []),
    });

    const VAULT_CANISTER_ID = Principal.fromText('un4fu-tqaaa-aaaab-qadjq-cai');

    const value = JSON.stringify({username: user, password: pw});
    const actor = Actor.createActor(idlFactory, {
        agent: new HttpAgent(
            {
                host: 'https://ic0.app/',
                identity,
            }
        ),
        canisterId: VAULT_CANISTER_ID,
    });

    actor.insert(key, value).then(() => {
        alert('insert complete!');
    });
}

function make_with_input_cell(className,content) {
    var cell = document.createElement('div');
    cell.className = className;
    var  field = document.createElement('input');
    field.setAttribute('type', 'text');
    field.setAttribute('value', content);
    cell.appendChild(field);
    return cell;
}

function make_input_cell(id) {
    var cell = document.createElement('div');
    cell.id = id;
    var input = document.createElement('input');
    input.type = 'text';
    cell.appendChild(input);
    return cell;
}

function make_edit_cell(className) {
    var cell = document.createElement('div');
    cell.className = className;

    var edit_button = document.createElement('input');
    edit_button.setAttribute("type", "button");
    edit_button.setAttribute("value", "edit");
    edit_button.addEventListener('click',make_row_editable,false);

    cell.appendChild(edit_button);
    return cell;
}

function make_text_cell(className, content) {
    var cell = document.createElement('div');
    cell.className = className;
    cell.appendChild(document.createTextNode(content));
    return cell;
}

function make_row(key, user, pw) {
    var row = document.createElement('div');
    row.className = "cred_row";
    row.id = "datarow-" + key;
    row.appendChild(make_text_cell('cred_key', key));
    row.appendChild(make_text_cell('cred_user', user));
    row.appendChild(make_text_cell('cred_pw', pw));
    row.appendChild(make_edit_cell('cred_control'));
    return row;
}

function save_row(event) {

    var row = event.target.parentNode.parentNode;

    var new_row = make_row(
        row.getElementsByClassName('cred_key')[0].childNodes[0].value,
        row.getElementsByClassName('cred_user')[0].childNodes[0].value,
        row.getElementsByClassName('cred_pw')[0].childNodes[0].value);

    var parentElement = row.parentNode;
    parentElement.replaceChild(new_row, row);
}

function make_save_cell(className) {
    var cell = document.createElement('div');
    cell.className = className;

    var edit_button = document.createElement('input');
    edit_button.setAttribute("type", "button");
    edit_button.setAttribute("value", "save");
    edit_button.addEventListener('click',save_row,false);

    cell.appendChild(edit_button);
    return cell;
}

function make_row_editable(event) {
    var row = event.target.parentNode.parentNode;

    var key = row.getElementsByClassName('cred_key')[0].childNodes[0].nodeValue;
    var editable_row = document.createElement('div');
    editable_row.className = row.className;
    editable_row.id = "datarow-" + key;

    editable_row.appendChild(make_with_input_cell('cred_key', key));
    editable_row.appendChild(make_with_input_cell('cred_user', row.getElementsByClassName('cred_user')[0].childNodes[0].nodeValue));
    editable_row.appendChild(make_with_input_cell('cred_pw', row.getElementsByClassName('cred_pw')[0].childNodes[0].nodeValue));

    editable_row.appendChild(make_save_cell('cred_control'));

    var parentElement = row.parentNode;
    parentElement.replaceChild(editable_row, row);
}

function add_row(key, user, pw) {
    var tab = document.getElementById('cred_table');

    var row = make_row(key, user, pw);
    var old_row = document.getElementById('datarow-' + key);
    if (old_row) {
        tab.replaceChild(row, old_row);
    } else {
        tab.insertBefore(row, tab.childNodes[tab.childNodes.length - 1]);
    }
}

function load_rows(rows) {
    for (const row of rows) {
        let key = row.key;
        let value = JSON.parse(row.value);
        let username = value.username;
        let pw = value.password;
        add_row(key, username, pw);
    }
}

function clear_input() {
    var row = document.getElementById('add_entry_row');
    row.getElementsByClassName('key_input')[0].value = '';
    row.getElementsByClassName('user_input')[0].value = '';
    row.getElementsByClassName('pw_input')[0].value = '';
}

create_new_button.addEventListener('click', async () => {
    var row = document.getElementById('add_entry_row');
    var key = row.getElementsByClassName('key_input')[0].value;
    var user = row.getElementsByClassName('user_input')[0].value;
    var pw = row.getElementsByClassName('pw_input')[0].value;

    const identity = await authClient.getIdentity();
    //const identity = Principal.fromText('2vxsx-fae');

    if (user.length!=0 && pw.length!=0){
    	call_insert(identity, key, user, pw);
    	add_row(key, user, pw);
    	clear_input();
    }
})

function initial_load() {
    const actor = Actor.createActor(idlFactory, {
        agent: new HttpAgent(
            {
                host: 'https://ic0.app/',
            }
        ),
        canisterId: VAULT_CANISTER_ID,
    });

    actor.get_kvstore().then(result => {
        load_rows(result);
    });
}

refresh.addEventListener('click', () => {
    initial_load();
})
