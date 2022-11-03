
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import * as ReactDOM from 'react-dom/client';
import React, { useState }  from 'react';
import Button from 'react-bootstrap/Button';

/*
let getAllSims = (dcrID) => {
    
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
                temp_array.push(`Trace id: ${item.id}, title: ${item.title} , last modified: ${item.modified}`);
            })
            document.getElementById('dpdn').innerHTML.
            //setSimIDs(temp_array);


            console.log(temp_array);
            
            //return temp_array;

        } else {
            console.log(response);
        }
    }
    fetchAPI(); 
}
*/


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
                //temp_array.push(`Trace id: ${item.id}, title: ${item.title} , last modified: ${item.modified}`);
                temp_array.push(item);
            })
            //setSimIDs(temp_array);

            /*
            setSimIDs( // Replace the state
                [
                    ...temp_array, // that contains all the new items
                ]
            );
            */
            console.log(temp_array);
            if (data.message.length > 0) {   
            }
            //return temp_array;
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
                    temp_array.push(`Trace id: ${item.id}, title: ${item.title} , last modified: ${item.modified}`);
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
    
    
    return (
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
        </div>
    );

    
  }
  
export default SimIDs;