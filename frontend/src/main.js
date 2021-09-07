import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';

const signInBtn = document.getElementById('signinBtn');
const signOutBtn = document.getElementById('signoutBtn');
const whoamiBtn = document.getElementById('whoamiBtn');
const hostUrlEl = document.getElementById('hostUrl');
const whoAmIResponseEl = document.getElementById('whoamiResponse');
const canisterIdEl = document.getElementById('canisterId');
const principalEl = document.getElementById('principal');
const idpUrlEl = document.getElementById('idpUrl');

/*
let authClient;

const init = async () => {
  authClient = await AuthClient.create();
  principalEl.innerText = await authClient.getIdentity().getPrincipal();

  // Redirect to the identity provider
  signInBtn.onclick = async () => {
    authClient.login({
      identityProvider: idpUrlEl.value,
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

  const canisterId = Principal.fromText(canisterIdEl.value);

  const actor = Actor.createActor(idlFactory, {
    agent: new HttpAgent({
      host: hostUrlEl.value,
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
*/

function make_input_cell(id) {
    var cell = document.createElement('div');
    cell.id = id;
    var input = document.createElement('input');
    input.type = 'text';
    cell.appendChild(input);
    return cell;
}

function make_save_cell(row_id) {
    var cell = document.createElement('div');
    var save_button = document.createElement('button');
    save_button.addEventListener('click', () => {
        alert("Save row" + row_id);
    });
    cell.appendChild(save_button);
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
    add_row(key, user, pw);
    clear_input();
})
