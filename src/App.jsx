import { useState, useEffect  } from 'react'
import './App.css'
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Route, Switch  } from "react-router-dom";
import Pagina1 from "./Component/Pagina1/Pagina1";
import Login from "./Component/Login/Login";
import Pago1 from "./Component/Pago1/Pago1";
import Home from "./Component/Home/Home";
import Registro from "./Component/Registro/Registro";
import PruebaAutomatica from "./Component/PruebaAutomatica/PruebaAutomatica";
import GeneradorPrueba from "./Component/PruebaAutomatica/GeneradorPrueba";
import MenuPaginas from "./Component/MenuPaginas/MenuPaginas";
import ListaProveedores from "./Component/ListaProveedores/ListaProveedores";

import { createClient } from '@supabase/supabase-js'

function App() {


  const supabase = createClient(import.meta.env.VITE_APP_SUPABASE_URL, 
    import.meta.env.VITE_APP_SUPABASE_ANON_KEY);

  
  return (
    <div className="container">
    <Router>
     <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route exact path="/Home">
          <Home />
        </Route>
        <Route exact path="/Login">
          <Login />
        </Route>
        <Route exact path="/Pago1">
          <Pago1 />
        </Route>
        <Route exact path="/Pagina1">
          <Pagina1 />
        </Route>
        <Route exact path="/Registro">
          <Registro />
        </Route>
        <Route exact path="/PruebaAutomatica">
          <PruebaAutomatica />
        </Route>
        <Route exact path="/GeneradorPrueba">
          <GeneradorPrueba />
        </Route>
        <Route exact path="/MenuPaginas">
          <MenuPaginas />
        </Route>
        <Route exact path="/ListaProveedores">
          <ListaProveedores />
        </Route>
     </Switch>
     </Router>
    </div>
  )
}

export default App
