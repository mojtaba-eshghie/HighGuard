
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import * as ReactDOM from 'react-dom/client';
import React, { useState }  from 'react';
import SimIDs from './SimIDs';


let MainForm = () => {
  
  let [dcrID, setDcrID] = useState(0);

  let handleMainFormSubmit = () => {

    
    
  }

  
  
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


          <SimIDs dcrID={dcrID}/>

    

          


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