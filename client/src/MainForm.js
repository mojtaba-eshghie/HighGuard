
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import * as ReactDOM from 'react-dom/client';


function MainForm() {
  let handleMainFormSubmit = () => {

    async function fetchAPI() {
      //let response = await fetch('/nodeapp');
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

  
    return (
        <Form>
          <Form.Group className="mb-3" controlId="">
            <Form.Label>Target deployed contract address</Form.Label>
            <Form.Control type="email" placeholder="e.g. 0xd1a0b5843f384f92a6759015c742fc12d1d579a1" />
            
          </Form.Group>
    
          <Button variant="primary" onClick={handleMainFormSubmit}>
            Start the monitor
          </Button>

          <div id="results">

          </div>



        </Form>
      );
  }
  
  export default MainForm;