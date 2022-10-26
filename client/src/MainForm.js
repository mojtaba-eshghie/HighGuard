
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';


function MainForm() {
    return (
        <Form>
          <Form.Group className="mb-3" controlId="">
            <Form.Label>Target deployed contract address</Form.Label>
            <Form.Control type="email" placeholder="e.g. 0xd1a0b5843f384f92a6759015c742fc12d1d579a1" />
            
          </Form.Group>
    
          <Button variant="primary" type="submit">
            Start the monitor
          </Button>
        </Form>
      );
  }
  
  export default MainForm;