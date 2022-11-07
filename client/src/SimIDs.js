import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import * as ReactDOM from 'react-dom/client';
import React from 'react';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { w3cwebsocket as W3CWebSocket } from "websocket";

// Creating websocket client
let client = new W3CWebSocket("ws://localhost:4000");


let getitems = (dcrID) => {
    async function fetchAPI() {
        let options = {
            method: 'GET',
        } 
        let response = await fetch(`http://localhost:3001/api/listsims?dcrID=${dcrID}`, options);
        
        if (response.status === 200) {
            let data = JSON.parse(await response.text());
            
            let temp_array = [];
            data.message.map((item) => {
                temp_array.push(item);
            })
            console.log(temp_array);
            if (data.message.length > 0) {   
            }
        } else {
            console.log(response);
        }     
    }
}

let DropdownItems = ({ dcrID, items }) => {
    let [prevSimID, setPrevSimID] = useState(0);
    let [selectedText, setSelectedText] = useState("Select a simulation from this dropdown after fetching IDs");
    let [selectedSim, setSelectedSim] = useState(0);

    let onSelect = (event) => {
        console.log('changed....');
        console.log(event.target.innerText.split(',')[0].split(':')[1].split(' ')[1]);
        setSelectedSim(parseInt(event.target.innerText.split(',')[0].split(':')[1].split(' ')[1]));
        setSelectedText(event.target.innerText);
        document.getElementById('selectedSimHolder').innerHTML = event.target.innerText.split(',')[0].split(':')[1].split(' ')[1];
    }

    if (dcrID != prevSimID) {
        prevSimID = dcrID;
        // it's time to re-render!
        return (
            <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" onChange={onSelect}>
                    {selectedText}
                </Dropdown.Toggle>
                
                <Dropdown.Menu id="dpdn">
                    {
                        items.map((item, index) => {
                            return (
                                <Dropdown.Item href={"#"+item.split(',')[0].split(':')[1].split(' ')[1]} value={parseInt(item.split(',')[0].split(':')[1].split(' ')[1])} onClick={onSelect}>{item}</Dropdown.Item>
                            );
                        })
                    }
                </Dropdown.Menu>

            </Dropdown>
        )   
    } else {
       
        return (
            <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" disabled>
                    Select a simulation from this dropdown...
                </Dropdown.Toggle>


            </Dropdown>
        )   
    }
}

let SimIDs = ({ dcrID }) => {
    let [simItems, setSimItems] = useState([]);
    let [isStarted, setIsStarted] = useState("none");

    let fetchItemsClicked = () => {
        async function fetchAPI() {
            let options = {
                method: 'GET',
            } 
            let response = await fetch(`http://localhost:3001/api/listsims?dcrID=${dcrID}`, options);
            
            if (response.status === 200) {
                let data = JSON.parse(await response.text());
                
                let temp_array = [];
                let innerHTML = '';
                data.message.map((item) => {
                    temp_array.push(`Trace id: ${item.id}, title: ${item.title} , initialized: ${item.initialized}`);
                })

                /*
                console.log(temp_array);
                */
                if (temp_array.length > 0) { 
                    setSimItems( // Replace the state
                        [ // with a new array
                            ...temp_array
                        ]
                    )
                }
                
            } else {
                console.log('failed fetching the api');
                console.log(response);
            }     
        }
        fetchAPI();
    }

    let handleMainFormSubmit = () => {
        isStarted = true;
        let simulation_id = document.getElementById('selectedSimHolder').innerHTML;
        
        let contract_addr = document.getElementById('contract_addr');
        client.send(`${dcrID},${simulation_id},${contract_addr.value}`);

        client.onmessage = (message) => {
            console.log(message.data);
            const dataFromServer = message.data;
            console.log('got reply! ', dataFromServer.toString());
            if (dataFromServer.toString().includes('Violation')) {
                document.getElementById('makemesmaller').innerHTML = document.getElementById('makemesmaller').innerHTML + `<div class="alert alert-danger" role="alert">${dataFromServer.toString()}</div>`;
            } else {
                document.getElementById('makemesmaller').innerHTML = document.getElementById('makemesmaller').innerHTML + `<div class="alert alert-success" role="alert">${dataFromServer.toString()}</div>`;
            }
        }
    }
    
    
    return (
        
          <div className="homecontrainerdiv">
            <Form.Group className="row" controlId="">
              <div className="col-md-3">
                <Form.Label>Simulation ID to monitor against</Form.Label>
              </div>
              
            <div className="col-md-9">      
                <div className="row">
                    <div className="col-md-3">
                        <Button variant="info" onClick={fetchItemsClicked}>
                            Fetch Simulations
                        </Button> 
                    </div>
                    <div className="col-md-9">
                        <DropdownItems dcrID={dcrID} items={simItems}/>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-8"></div>
                    <div className="col-md-4">
                        <div className="homecontrainerdiv">
                            <Button variant="primary" id="startmon" onClick={handleMainFormSubmit}>
                                Start the monitor
                            </Button> 
                        </div>
                    </div>
                </div>
                <div id="selectedSimHolder"></div>
            </div>

                  
            </Form.Group>


            <div className="row">
                <div className="col-md-12 card" id="makemesmaller">
                {/*<div class="p-3 mb-2 bg-success text-white">.bg-success</div>*/}
                </div>
            </div>
          </div>

            
        
    );

    
  }
  
export default SimIDs;