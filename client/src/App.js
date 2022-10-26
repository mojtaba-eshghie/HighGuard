import logo from './img/claw.png';
import './App.css';

import 'bootstrap/dist/css/bootstrap.min.css';

import MainForm from './MainForm';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        
        <MainForm />
        
      </header>

      
    </div>
  );
}

export default App;
