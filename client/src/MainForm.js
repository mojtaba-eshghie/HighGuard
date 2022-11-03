
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import * as ReactDOM from 'react-dom/client';
import React, { useState }  from 'react';
import SimIDs from './SimIDs';


let MainForm = () => {
  /*
  this.state = {
    dcr_id:0
  }
  */
  let [dcrID, setDcrID] = useState(0);

  let handleMainFormSubmit = () => {

    async function fetchAPI() {
      
      console.log('heeeee');
      
      let response = await fetch('http://localhost:3001/api/');
  
      console.log(response.status); // 200
      console.log(response.statusText); // OK
      
      if (response.status === 200) {
          let data = JSON.parse(await response.text());
          

          
          let results = ReactDOM.createRoot(
            document.getElementById("results")
          );
          
          results.render(<h1>{data.message}</h1>)

          //console.log(data);
          
          
          // handle data
      }
    }
    
    //console.log('777777');
    fetchAPI();
    //return fetchAPI();

    
  }
  /*
  let dcr_graph_id_entered = (event) => {
    this.state.dcr_id = parseInt(event.target.value, 10)
    console.log(`entered id: ${this.state.dcr_id}`);
  }
  */

  
    return (
      <div class="row">


          <div className="col-md-2"></div>
          <div className="col-md-8">
        <Form>
          <div className="homecontrainerdiv">
          <Form.Group className="row" controlId="">
            <div className="col-md-3">
              <Form.Label>Target deployed contract address</Form.Label>
            </div>
            <div className="col-md-9">
              <Form.Control type="text" placeholder="e.g. 0xd1a0b5843f384f92a6759015c742fc12d1d579a1" />
            </div>
          </Form.Group>

          <div className="homecontrainerdiv">
            <Form.Group className="row" controlId="">
              <div className="col-md-3">
                <Form.Label>DCR Graph Model ID</Form.Label>
              </div>

              <div className="col-md-9">
                <Form.Control type="text" placeholder="e.g. 1327699" onBlur={(e) => {setDcrID(e.target.value)}} id="dcr_id"/>
              </div>
            </Form.Group>
          </div>

          <div className="homecontrainerdiv">
            <Form.Group className="row" controlId="">
              <div className="col-md-3">
                <Form.Label>Simulation ID to monitor against</Form.Label>
              </div>
              
              <SimIDs dcrID={dcrID}/>
                  
            </Form.Group>
          </div>

          <div className="homecontrainerdiv">
            <Button variant="primary" onClick={handleMainFormSubmit} disabled>
              Start the monitor
            </Button> 
          </div>
    

          


          <div id="results">

          </div>


          </div>
        </Form>
        </div>
          <div className="col-md-2"></div>
        </div>
      );
  }
  
  export default MainForm;