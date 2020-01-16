/* jshint esversion: 6 */
import React from 'react';
import './App.css';
import { complex } from 'mathjs';
import CustomizedSlider from './slider.js';
import { PaperContainer, Circle } from '@psychobolt/react-paperjs';
import Grid from '@material-ui/core/Grid';
import Checkbox from '@material-ui/core/Checkbox';
import cividis from './cividisHex.js';
import viridis from './viridisHex.js';
import g from './geometry.js';
const startingCircles = g.startingCircles;
const children = g.children;

function palette(depth, hexs){
  var colors = new Array(depth);
  for(let i = 0; i < depth; ++i){
    var idx = Math.floor(255 * i/(depth-1));
    colors[i] = hexs[idx];
  }
  return colors;
}

function fillColor(zcircle, color) {
  return {
    gradient: {
      stops: [color, 'black'],
      radial: true
    },
    origin: [zcircle.center.re, zcircle.center.im],
    destination: [zcircle.center.re + zcircle.radius, zcircle.center.im]
  };
}

/* jshint ignore:start */
function makeCircle(zcircle, color, fill) {
  var cx = zcircle.center.re, cy = zcircle.center.im, r = zcircle.radius;
  return fill ? (
    <Circle
      key = {["circle",cx,cy,r].join("_")}
      center = {[cx, cy]} radius = {r}
      fillColor = {fillColor(zcircle, color)}
    />
  ) : (
      <Circle
        key={["circle", cx, cy, r].join("_")}
        center={[cx, cy]} radius={r}
        strokeColor={color}
      />
    );
}

function makeCircles(c0, n, phi, shift, depth, nest, ni, hexs){
  if(phi === 0) return null;
  var scircles = startingCircles(c0, n, phi, n*shift);
  var circles0 = scircles[0];
  var invCircles = scircles[1];
  // construct the children ------------------------------------------------------
  var allCircles = new Array(depth);
  allCircles[0] = circles0;
  var previous = [];
  for(let i = 1; i < depth; ++i){
    allCircles[i] = children(invCircles, allCircles[i - 1], previous, c0.radius);
    previous = previous.concat(allCircles[i - 1]);
  }
  var Circles = new Array(depth);
  var colors = palette(depth, hexs);
  for (let i = 0; i < depth; ++i) {
    Circles[i] = allCircles[i].map(function(x, index){
      return makeCircle(x, colors[i], 
        !nest || i>0 || (i===0 && index===n));
    });
  }
  if(nest){
    var Circles2 = [[].concat.apply([], Circles)];
    for (let i = 0; i < n; ++i) {
      var newCircles = makeCircles(circles0[i], ni[i], phi, shift, 2, false, null, viridis);
      Circles2.push(newCircles);
    }
    return [].concat.apply([], Circles2);
  }
  return [].concat.apply([], Circles);
}

function update_ni(n, ni) {
  if (ni.length < n) {
    for (let i = 0; i < n - ni.length; ++i) {
      ni.push(3);
    }
  }
  return ni;
}

function replaceElt(array, index, value) {
  var arrayClone = array.slice();
  arrayClone[index] = value;
  return arrayClone;
}

function niInputs(n, ni, nest, app) {
  if(!nest) return null;
  var sliders = new Array(n);
  for (let i = 0; i < n; ++i) {
    var id = "n_" + i;
    var labelkey = "labn_" + i;
    var divkey = "divn_" + i;
    sliders[i] = (
      <div key={divkey}>
        <label htmlFor={id} key={labelkey}>n<sub>{i + 1}</sub></label>
        <CustomizedSlider
          style={{ width: "70%" }}
          title=""
          key={id}
          defaultValue={app.state.ni[i]} min={3} max={7}
          onChangeCommitted={(e, value) => app.setState({ ni: replaceElt(ni, i, value) })}
        />
      </div>
    );
  }
  return sliders;
}


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      n: 3,
      phi: 0.25, 
      shift: 0,
      depth: 2,
      nest: false,
      ni: [3,3,3]
    };
  }

  changeHandler_n = (e, value) => this.setState(
    {
      n: value,
      phi: this.state.phi,
      shift: this.state.shift,
      depth: this.state.depth,
      ni: update_ni(value, this.state.ni)
    }
  );

  changeHandler_phi = (e, value) => this.setState(
    {
      n: this.state.n,
      phi: value,
      shift: this.state.shift,
      depth: this.state.depth
    }
  );

  changeHandler_shift = (e, value) => this.setState(
    {
      n: this.state.n,
      phi: this.state.phi,
      shift: value,
      depth: this.state.depth
    }
  );

  changeHandler_depth = (e, value) => this.setState(
    {
      n: this.state.n,
      phi: this.state.phi,
      shift: this.state.shift,
      depth: value
    }
  );

  changeHandler_nest = (evt) => this.setState(
    {
      nest: evt.target.checked
    }
  );

  render() {
    return (
      <React.Fragment>
        <Grid container>
          <Grid item xs={12}>
            <div className="inline vtop">
              <CustomizedSlider 
                title = "Starting circles"
                defaultValue={this.state.n} min={3} max={7}
                onChangeCommitted={this.changeHandler_n}
              />
              <CustomizedSlider
                title="phi (controls the radii of the starting cirles)"
                defaultValue={this.state.phi} min={-0.95} max={0.95} step = {0.05}
                onChangeCommitted={this.changeHandler_phi}
              />
              <CustomizedSlider
                title="shift (kind of rotation)"
                defaultValue={this.state.shift} min={0} max={1} step={0.01}
                onChangeCommitted={this.changeHandler_shift}
              />
              <CustomizedSlider
                title="depth"
                defaultValue={this.state.depth} min={1} max={5} step={1}
                onChangeCommitted={this.changeHandler_depth}
              />
              <div>
                <div className="inline vtop">
                  <label htmlFor="nest">Nest</label>
                  <Checkbox
                    id = "nest"
                    onChange = {this.changeHandler_nest}
                  />
                </div>
                <div className="inline" style={{width: "10px"}}></div>
                <div className="inline">
                  {niInputs(this.state.n, this.state.ni, this.state.nest, this)}
                </div>
              </div>
            </div>
            <div className="inline">
              <PaperContainer>
                <Circle
                  center={[250, 250]} radius={240}
                  strokeColor='black'
                />
                {makeCircles(
                  { center: complex(250, 250), radius: 240 }, 
                  this.state.n, 
                  this.state.phi, 
                  this.state.shift, 
                  this.state.depth,
                  this.state.nest,
                  this.state.ni,
                  cividis
                )}
              </PaperContainer>
            </div>
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}
/* jshint ignore:end */

export default App;
