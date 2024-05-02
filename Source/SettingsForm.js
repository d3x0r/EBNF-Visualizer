import {Popup,popups} from "../node_modules/@d3x0r/popups/popups.mjs";
import {Node} from "./Graph.js";

export class SettingsForm extends Popup {
    
    constructor() {
        super( "Settings" );
        //popups.makeTextField( this, Node, "CharFont", "Font" );
        popups.makeTextInput( this, Node, "CharFont", "Font", false,false, false );
        popups.makeTextInput( this, Node, "CharColor", "Color", false,false, false );
        popups.makeTextInput( this, Node, "ArrowSize", "Arrow Size", false,false, true );
        popups.makeCheckbox( this, Node, "OptimizeGraph", "Optimize" );
        popups.makeTextInput( this, Node, "SymbolGapHeight", "Symbol Gap Height", false,false, true );
        popups.makeTextInput( this, Node, "ComponentGapWidth", "Component Gap Width", false,false, true );
        popups.makeTextInput( this, Node, "ComponentGapHeight", "Component Gap Height", false,false, true );
        popups.makeTextInput( this, Node, "LinePen", "Line Color", false,false, false );
			this.center();
    }
    
}