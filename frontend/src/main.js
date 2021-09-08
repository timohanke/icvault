import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';

const signInBtn = document.getElementById('signinBtn');
const signOutBtn = document.getElementById('signoutBtn');
const whoamiBtn = document.getElementById('whoamiBtn');
const hostUrlEl = document.getElementById('hostUrl');
const whoAmIResponseEl = document.getElementById('whoamiResponse');
const principalEl = document.getElementById('principal');

const keySyncCanister = "khpze-daaaa-aaaai-aal6q-cai";

let authClient;

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

  const canisterId = keySyncCanister;

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

function call_insert(key, user, pw) {
    //const identity = await authClient.getIdentity();
    const identity = Principal.fromText('2vxsx-fae');

    const idlFactory = ({ IDL }) =>
        IDL.Service({
        insert: IDL.Func([
            IDL.Text,
            IDL.Record({
                username: IDL.Text,
                password: IDL.Text,
            })
        ], [], ['update']),
    });

    const canisterId = Principal.fromText('uvf7r-liaaa-aaaah-qabnq-cai');

    const actor = Actor.createActor(idlFactory, {
        agent: new HttpAgent(
            {
                host: 'https://ic0.app/',
            }
        ),
        canisterId,
    });

    actor.insert(key, {username: user, password: pw}).then(() => {
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


function save_row(event) {

    var row = event.target.parentNode.parentNode;

    var new_row = document.createElement('div');
    new_row.className = "cred_row";
    new_row.appendChild(make_text_cell('cred_key',row.getElementsByClassName('cred_key')[0].childNodes[0].value));
    new_row.appendChild(make_text_cell('cred_user',row.getElementsByClassName('cred_user')[0].childNodes[0].value));
    new_row.appendChild(make_text_cell('cred_pw', row.getElementsByClassName('cred_pw')[0].childNodes[0].value));
    new_row.appendChild(make_edit_cell('cred_control')); 

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

    var editable_row = document.createElement('div');
    editable_row.className = row.className;

    editable_row.appendChild(make_with_input_cell('cred_key',row.getElementsByClassName('cred_key')[0].childNodes[0].nodeValue));
    editable_row.appendChild(make_with_input_cell('cred_user',row.getElementsByClassName('cred_user')[0].childNodes[0].nodeValue));
    editable_row.appendChild(make_with_input_cell('cred_pw',row.getElementsByClassName('cred_pw')[0].childNodes[0].nodeValue));

    editable_row.appendChild(make_save_cell('cred_control')); 

    var parentElement = row.parentNode;
    parentElement.replaceChild(editable_row, row);

    //alert("Edit row:" + row_id + " :" + parentElement.nodeName );
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

function add_row(key, user, pw) {
    var tab = document.getElementById('cred_table');

    var row = document.createElement('div');
    row.className = "cred_row";
    row.appendChild(make_text_cell('cred_key', key));
    row.appendChild(make_text_cell('cred_user', user));
    row.appendChild(make_text_cell('cred_pw', pw));
    row.appendChild(make_edit_cell('cred_control')); 

    tab.insertBefore(row, tab.childNodes[tab.childNodes.length - 1]);
}

function clear_input() {
    var row = document.getElementById('add_entry_row');
    row.getElementsByClassName('key_input')[0].value = '';
    row.getElementsByClassName('user_input')[0].value = '';
    row.getElementsByClassName('pw_input')[0].value = '';
}

create_new_button.addEventListener('click', () => {
    var row = document.getElementById('add_entry_row');
    var key = row.getElementsByClassName('key_input')[0].value;
    var user = row.getElementsByClassName('user_input')[0].value;
    var pw = row.getElementsByClassName('pw_input')[0].value;
    call_insert(key, user, pw);
    add_row(key, user, pw);
    clear_input();
})
