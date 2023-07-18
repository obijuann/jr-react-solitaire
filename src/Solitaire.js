import './Solitaire.css';

function Solitaire() {
  return (
    <div id="playarea">
      <div id="stock">
        <div id="draw" className="card"></div>
      </div>
      <div id="waste">
      </div>
      <div id="foundation">
        <div id="stack1" className="card"></div>
        <div id="stack2" className="card"></div>
        <div id="stack3" className="card"></div>
        <div id="stack4" className="card"></div>
      </div>
      <div id="tableau">
        <div id="tab1" className="card"></div>
        <div id="tab2" className="card"></div>
        <div id="tab3" className="card"></div>
        <div id="tab4" className="card"></div>
        <div id="tab5" className="card"></div>
        <div id="tab6" className="card"></div>
        <div id="tab7" className="card"></div>
      </div>
      <div id="menu"></div>
      <div id="timer"></div>
    </div>
  );
}

export default Solitaire;
