// public imports
import logo from './img/claw.png';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';


// react imports
import MainForm from './MainForm';
import Nav from './TopNavigation';

function App() {
  return (
    <div className="App">
        <Nav />
        <MainForm />
    </div>
  );
}

export default App;
