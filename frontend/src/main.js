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
const seedResponseEl = document.getElementById('seedResponse');
const syncResponseEl = document.getElementById('syncResponse');

const keySyncCanister = "khpze-daaaa-aaaai-aal6q-cai";
const vaultCanister = "uvf7r-liaaa-aaaah-qabnq-cai"; // deployment on IC
//const vaultCanister = "un4fu-tqaaa-aaaab-qadjq-cai"; // from Motoko playground

const vaultIdlFactory = ({ IDL }) =>
    IDL.Service({
    insert:
        IDL.Func([IDL.Text, IDL.Text], [], ['update']),
    get_kvstore:
        IDL.Func([], [IDL.Vec(IDL.Record({"key": IDL.Text, "value": IDL.Text}))], []),
    'delete':
        IDL.Func([IDL.Text], [], []),
    lookup : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], []),
    replace : IDL.Func([IDL.Text, IDL.Text], [IDL.Opt(IDL.Text)], []),
});

let authClient;

const keySync_idlFactory = ({ IDL }) => {
  const PublicKey = IDL.Text;
  const Ciphertext = IDL.Text;
  const GetCiphertextError = IDL.Variant({
    'notSynced' : IDL.Null,
    'notFound' : IDL.Null,
  });
  const Result = IDL.Variant({ 'ok' : Ciphertext, 'err' : GetCiphertextError });
  const DeviceAlias = IDL.Text;
  const KeySync = IDL.Service({
    'get_ciphertext' : IDL.Func([PublicKey], [Result], ['query']),
    'get_devices' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(DeviceAlias, PublicKey))],
        ['query'],
      ),
    'get_unsynced_pubkeys' : IDL.Func([], [IDL.Vec(PublicKey)], ['query']),
    'isSeeded' : IDL.Func([], [IDL.Bool], ['query']),
    'register_device' : IDL.Func([DeviceAlias, PublicKey], [IDL.Bool], []),
    'remove_device' : IDL.Func([DeviceAlias], [], ['oneway']),
    'seed' : IDL.Func([PublicKey, Ciphertext], [], ['oneway']),
    'submit_ciphertexts' : IDL.Func(
        [IDL.Vec(IDL.Tuple(PublicKey, Ciphertext))],
        [],
        ['oneway'],
      ),
    'whoami' : IDL.Func([], [IDL.Principal], ['query']),
  });
  return KeySync;
};

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function change_app_view(state) {
    for (const view of ['loading', 'table']) {
        var e = document.getElementById('app_view_' + view);
        if (view == state) {
            e.className = 'app_state_visible';
        } else {
            e.className = 'app_state_invisible';
        }
    }
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

  let local_store = window.localStorage;
  if (!local_store.getItem("PublicKey") || !local_store.getItem("PrivateKey")) {
    console.log("Local store does not exists, generating keys");
    let keypair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        // Consider using a 4096-bit key for systems that require long-term security
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );
    const exported = await window.crypto.subtle.exportKey('spki', keypair.publicKey);
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);
    window.myPublicKeyString = exportedAsBase64;

    console.log("Exporting private key .. ");
    const exported_private = await window.crypto.subtle.exportKey('pkcs8', keypair.privateKey)
    const exported_privateAsString = ab2str(exported_private);
    const exported_privateAsBase64 = window.btoa(exported_privateAsString);
    window.myPrivateKeyString = exported_privateAsBase64;

    local_store.setItem("PublicKey", window.myPublicKeyString);
    local_store.setItem("PrivateKey", window.myPrivateKeyString);

    window.myPublicKey = keypair.publicKey;
    window.myPrivateKey = keypair.privateKey;

  } else {

    console.log("Loading keys from local store");
    window.myPublicKeyString = local_store.getItem("PublicKey");
    window.myPrivateKeyString = local_store.getItem("PrivateKey");

    window.crypto.subtle.importKey(
        'spki',
        str2ab(window.atob(window.myPublicKeyString)),
        {
            name: "RSA-OAEP",
            hash: {name: "SHA-256"},
        },
        true,
        ["encrypt", "wrapKey"]
    ).then((key) => {
        console.log("Success importing public key: " + key);
        window.myPublicKey = key;
    }).catch((err) => {
        console.error("Failed to import public key: " + err);
    });

    window.crypto.subtle.importKey(
        'pkcs8',
        str2ab(window.atob(window.myPrivateKeyString)),
        {
            name: "RSA-OAEP",
            hash: {name: "SHA-256"},
        },
        true,
        ["decrypt", "unwrapKey"]
    ).then((key) => {
        console.log("Success importing private key: " + key);
        window.myPrivateKey = key;
    }).catch((err) => {
        console.error("Failed to import private key: " + err);
    });
  }
  console.log("Public key is: " + window.myPublicKeyString);
  console.log("Private key is: " + window.myPrivateKeyString);

  if (local_store.getItem("DeviceAlias")) {
    document.getElementById('deviceAliasLocalStore').innerHTML = local_store.getItem("DeviceAlias");
  }

  await initial_load();
};

init();

whoamiBtn.addEventListener('click', async () => {
  const identity = await authClient.getIdentity();

  const canisterId = Principal.fromText(keySyncCanister);

  const actor = Actor.createActor(keySync_idlFactory, {
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
  const canisterId = Principal.fromText(keySyncCanister);
  const actor = Actor.createActor(keySync_idlFactory, {
    agent: new HttpAgent({
      host: "https://ic0.app/",
      identity,
    }),
    canisterId,
  });

  registerDeviceEl.innerText = 'Registering public key for device ' + deviceAliasEl.value + ' : ' + window.myPublicKeyString;

  actor.register_device(deviceAliasEl.value, window.myPublicKeyString).then(result => {
    if (result) {
        window.localStorage.setItem("DeviceAlias", deviceAliasEl.value);
        registerDeviceEl.innerText += "\nDone.";
    } else {
        registerDeviceEl.innerText += "\nDevice alias already registered. Choose a unique alias. To overwrite an existing device call remove_device first (currently only through Candid UI).";
    }
  });
});

seedBtn.addEventListener('click', async () => {
  const identity = await authClient.getIdentity();
  const canisterId = Principal.fromText(keySyncCanister);
  const actor = Actor.createActor(keySync_idlFactory, {
    agent: new HttpAgent({
      host: "https://ic0.app/",
      identity,
    }),
    canisterId,
  });
  
  // TODO: make sure step 1 is completed, i.e. public key is registered

  seedResponseEl.innerText = 'Checking if the secret is already defined ("seeded")...';

  actor.isSeeded().then( result => {
    if (result) {
        seedResponseEl.innerText += '\nAlready seeded. Now have to sync the secret.';
    } else {
        seedResponseEl.innerText += '\nNot seeded. Seeding now...';
        // Generate secret
        window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["encrypt", "decrypt"]
        ).then( (key) => {
            // Wrap key for own pubkey
            window.crypto.subtle.wrapKey(
                'raw', 
                key, 
                window.myPublicKey,
                { name: "RSA-OAEP" }
            ).then( (wrapped) => {
                // serialize it
                const exportedAsString = ab2str(wrapped);
                const exportedAsBase64 = window.btoa(exportedAsString);
                console.log("Submitting wrapped secret: " + exportedAsBase64);
                // Call actor.seed
                actor.seed(window.myPublicKeyString, exportedAsBase64).then( () => {
                    seedResponseEl.innerText += "\nDone.";
                });
            });
        });
    }
  })
});

syncBtn.addEventListener('click', async () => {
  const identity = await authClient.getIdentity();
  const canisterId = Principal.fromText(keySyncCanister);
  const actor = Actor.createActor(keySync_idlFactory, {
    agent: new HttpAgent({
      host: "https://ic0.app/",
      identity,
    }),
    canisterId,
  });

  syncResponseEl.innerText = 'Retrieving secret for my public key...';
  console.log('gettin ciphertext for public key : ',window.myPublicKeyString);
  // call get_ciphertext
  actor.get_ciphertext(window.myPublicKeyString).then( (result) => {
    console.log('get_ciphertext : ',result);
    if ('err' in result) {
        if ('notFound' in result.err) {
            syncResponseEl.innerText += '\nOwn public key is not registered. Go back to step 1.';
            console.log('get_ciphertext error: notFound');
        } else {
            syncResponseEl.innerText += '\nOwn public key is not synced. Do step 3 on a synced device.';
            console.log('get_ciphertext error: notSynced');
        }
    } else {
        syncResponseEl.innerText += '\nDone.';
        console.log('sync succesful: ',result.ok);
        syncResponseEl.innerText += '\nUnwrapping...';
        // unwrap key
        window.crypto.subtle.unwrapKey(
            'raw',
            str2ab(window.atob(result.ok)),
            window.myPrivateKey,
            { 
                name: "RSA-OAEP" 
            },
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            [ "encrypt", "decrypt"]
        ).then((unwrapped) => {
           syncResponseEl.innerText += '\nDone.';
        });
          // store key in window.thesecret

          // re-encrypt for others
          // call submit_ciphertexts

    }
  });
});

// The function encrypts all data deterministically in order to enable lookups.
// It would be possible to use deterministic encryption only for the encryption
// of keys. All data is correctly encrypted using deterministic encryption for
// the sake of simplicity.
function encrypt(data, encryption_key) {
  var CryptoJS = require("crypto-js");
  // An all-zero initialization vector is used.
  var init_vector = CryptoJS.enc.Base64.parse("0000000000000000000000");
  // The encryption key is hashed.
  var hash = CryptoJS.SHA256(encryption_key);
  // AES is used to get the encrypted data.
  var encrypted_data = CryptoJS.AES.encrypt(data, hash, {iv: init_vector});
  return encrypted_data.toString();
}

// The function decrypts the given input data.
function decrypt(data, decryption_key) {
  var CryptoJS = require("crypto-js");
  // The initialization vector must also be provided.
  var init_vector = CryptoJS.enc.Base64.parse("0000000000000000000000");
  // The encryption key is hashed.
  var hash = CryptoJS.SHA256(decryption_key);
  // THe data is decrypted using AES.
  var decrypted_data = CryptoJS.AES.decrypt(data, hash, {iv: init_vector});
  // The return value must be converted to plain UTF-8.
  return decodeURIComponent(decrypted_data.toString().replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'));
}

function call_insert(identity, key, user, pw) {

    const VAULT_CANISTER_ID = Principal.fromText(vaultCanister);

    const value = JSON.stringify({username: user, password: pw});
    const actor = Actor.createActor(vaultIdlFactory, {
        agent: new HttpAgent(
            {
                host: 'https://ic0.app/',
                identity,
            }
        ),
        canisterId: vaultCanister,
    });

    const encrypted_key = encrypt(key, "verysecret");
    const encrypted_value = encrypt(value, "verysecret");
    actor.insert(encrypted_key, encrypted_value).then(async () => {
        await fetch_single_row(key);
    });
}

function make_with_input_cell(className, content, ro=false) {
    var cell = document.createElement('div');
    cell.className = className;
    var  field = document.createElement('input');
    field.setAttribute('type', 'text');
    field.setAttribute('value', content);
    if (ro) {
        field.readOnly = true;
    }
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
    edit_button.addEventListener('click', make_row_editable, false);
    cell.appendChild(edit_button);

    var delete_button = document.createElement('input');
    delete_button.setAttribute("type", "button");
    delete_button.setAttribute("value", "delete");
    delete_button.addEventListener('click', start_delete_row, false);
    cell.appendChild(delete_button);

    return cell;
}

const fetch_single_row = async (key) => {
    const identity = await authClient.getIdentity();
    const actor = Actor.createActor(vaultIdlFactory, {
        agent: new HttpAgent(
            {
                host: 'https://ic0.app/',
                identity,
            }
        ),
        canisterId: vaultCanister,
    });

    actor.lookup(encrypt(key, "verysecret")).then((value) => {
        if (value.length >= 1) {
            value = JSON.parse(decrypt(value[0], "verysecret"));
            add_row(key, value.username, value.password, false);
        } else {
            remove_row(key);
        }
    });
}

function make_text_cell(className, content) {
    var cell = document.createElement('div');
    cell.className = className;
    cell.appendChild(document.createTextNode(content));
    return cell;
}

function make_progress_cell(className) {
    var cell = document.createElement('div');
    cell.className = className;
    var img = document.createElement('img');
    img.className = 'small_spinner';
    img.src = 'spinner.gif';
    cell.appendChild(img);
    return cell;
}

function make_row(key, user, pw, in_progress) {
    var row = document.createElement('div');
    row.className = "cred_row";
    row.id = "datarow-" + key;
    row.appendChild(make_text_cell('cred_key', key));
    row.appendChild(make_text_cell('cred_user', user));
    row.appendChild(make_text_cell('cred_pw', pw));
    if (in_progress) {
        row.appendChild(make_progress_cell('cred_control'));
    } else {
        row.appendChild(make_edit_cell('cred_control'));
    }
    return row;
}

function save_row(event) {

    var row = event.target.parentNode.parentNode;

    var key = row.getElementsByClassName('cred_key')[0].childNodes[0].value;
    var user = row.getElementsByClassName('cred_user')[0].childNodes[0].value;
    var pw = row.getElementsByClassName('cred_pw')[0].childNodes[0].value;

    var new_row = make_row(key, user, pw, true);

    const identity = authClient.getIdentity();

    if (user.length!=0 && pw.length!=0){
    	call_insert(identity, key, user, pw);
    	var parentElement = row.parentNode;
	parentElement.replaceChild(new_row, row);
    }
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

    editable_row.appendChild(make_with_input_cell('cred_key', key, true));
    editable_row.appendChild(make_with_input_cell('cred_user', row.getElementsByClassName('cred_user')[0].childNodes[0].nodeValue));
    editable_row.appendChild(make_with_input_cell('cred_pw', row.getElementsByClassName('cred_pw')[0].childNodes[0].nodeValue));

    editable_row.appendChild(make_save_cell('cred_control'));

    var parentElement = row.parentNode;
    parentElement.replaceChild(editable_row, row);
}

function start_delete_row(event) {
    var row = event.target.parentNode.parentNode;
    var key = row.getElementsByClassName('cred_key')[0].childNodes[0].nodeValue;
    var user = row.getElementsByClassName('cred_user')[0].childNodes[0].nodeValue;
    var pw = row.getElementsByClassName('cred_pw')[0].childNodes[0].nodeValue;

    add_row(key, user, pw, true);

    const actor = Actor.createActor(vaultIdlFactory, {
        agent: new HttpAgent(
            {
                host: 'https://ic0.app/',
            }
        ),
        canisterId: vaultCanister,
    });

    actor.delete(encrypt(key, "verysecret")).then(result => {
        fetch_single_row(key);
    });
}

function add_row(key, user, pw, in_progress) {
    var tab = document.getElementById('cred_table');

    var row = make_row(key, user, pw, in_progress);
    var old_row = document.getElementById('datarow-' + key);
    if (old_row) {
        tab.replaceChild(row, old_row);
    } else {
        tab.insertBefore(row, tab.childNodes[tab.childNodes.length - 1]);
    }
}

function remove_row(key) {
    var tab = document.getElementById('cred_table');
    var old_row = document.getElementById('datarow-' + key);
    if (old_row) {
        old_row.remove();
    }
}

function load_rows(rows) {
    for (const row of rows) {
        try {
            let key = decrypt(row.key, "verysecret");
            console.log("encrypted "+row.value);
            console.log("decrypted "+decrypt(row.value, "verysecret"));
            let value = JSON.parse(decrypt(row.value, "verysecret"));
            let username = value.username;
            let pw = value.password;
            add_row(key, username, pw, false);
        } catch (error) {
            console.error("Failed to read row: " + row + " - with error: " + error);
        }
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
    	add_row(key, user, pw, true);
    	clear_input();
    	call_insert(identity, key, user, pw);
    }
})

const initial_load = async () => {
    const actor = Actor.createActor(vaultIdlFactory, {
        agent: new HttpAgent(
            {
                host: 'https://ic0.app/',
            }
        ),
        canisterId: vaultCanister,
    });

    actor.get_kvstore().then(result => {
        load_rows(result);
        change_app_view('table');
    });
}

refresh.addEventListener('click', async () => {
    change_app_view('loading');
    initial_load();
})
