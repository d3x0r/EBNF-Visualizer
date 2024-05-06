import {Popup,popups} from "../node_modules/@d3x0r/popups/popups.mjs";
import {Node} from "./Graph.js";

export class SettingsForm extends Popup {
    
    constructor() {
        super( "Settings", null, {enableClose:true} );
        //popups.makeTextField( this, Node, "CharFont", "Font" );
			const restart = document.createElement( "div" );
			this.appendChild( restart );
			restart.innerHTML= "Some settings changes require reloading the model.<br>  Many visual changes just require re-selecting<br> the model to draw from the loaded choices.<br>";
        popups.makeTextInput( this, Node, "TitleFont", "Title Font", false,false, false );
        popups.makeTextInput( this, Node, "CharFont", "Font", false,false, false );
        popups.makeTextInput( this, Node, "CharColor", "Color", false,false, false );
        popups.makeTextInput( this, Node, "ArrowSize", "Arrow Size", false,false, true );
        popups.makeCheckbox( this, Node, "OptimizeGraph", "Optimize" );
        popups.makeCheckbox( this, Node, "showBorders", "Show Borders" );
        popups.makeTextInput( this, Node, "SymbolGapHeight", "Symbol Gap Height", false,false, true );
        popups.makeTextInput( this, Node, "SymbolGapWidth", "Symbol Gap Width", false,false, true );
        popups.makeTextInput( this, Node, "ComponentGapWidth", "Component Gap Width", false,false, true );
        popups.makeTextInput( this, Node, "ComponentGapHeight", "Component Gap Height", false,false, true );
        popups.makeTextInput( this, Node, "LinePen", "Line Color", false,false, false );
        this.show();
        this.center();
    }
    
}