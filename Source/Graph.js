/*-------------------------------------------------------------------------
EBNF Visualizer
Copyright (c) 2005 Stefan Schoergenhumer, Markus Dopler
supported by Hanspeter Moessenboeck, University of Linz

This program is free software; you can redistribute it and/or modify it 
under the terms of the GNU General Public License as published by the 
Free Software Foundation; either version 2, or (at your option) any 
later version.

This program is distributed in the hope that it will be useful, but 
WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License 
for more details.

You should have received a copy of the GNU General Public License along 
with this program; if not, write to the Free Software Foundation, Inc., 
59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
-------------------------------------------------------------------------*/


class Point{
	constructor(x,y){
		this.X=x;
		this.Y=y;
	}	
}
class PointF{
	constructor(x,y){
		this.X=x;
		this.Y=y;
	}	
}
class Size{
	constructor(x,y){
		this.Width=x || 0;
		this.Height=y || 0;
	}	
}
class Rectangle{
	constructor(x,y,w,h){
		this.X=x;
		this.Y=y;
		this.Width=w;
		this.Height=h;
	}		
}

export class Symbol {
	 static  terminals = [];//new ArrayList();
	 static  nonterminals = [];//new ArrayList();
	
	typ;         // t, nt
	name;        // symbol name
	graph;       // nt: to first node of syntax graph

	constructor( typ, name) {
		if (name.length == 2 && name[0] == '"') {
			Console.WriteLine("empty token not allowed"); name = "???";
		}
		this.typ = typ; this.name = name;
		switch (typ) {
			case Node.t: Symbol.terminals.push(this); break;
			case Node.nt: Symbol.nonterminals.push(this); break;
		}
	}

	static Find( name) {
		return Symbol.terminals.find( s=>s.name == name) ?? Symbol.nonterminals.find( s=>s.name == name);
	}
	

	static terminalToNt( name)	{
		const t = Symbol.terminals.findIndex ( s=>s.name == name);
		if( t >= 0 ) {
			Symbol.nonterminals.push( Symbol.terminals[t]);
			Symbol.terminals.splice(t,1);
		}
	}	
}

//---------------------------------------------------------------------
// Syntax graph (class Node, class Graph)
//---------------------------------------------------------------------

export class Node {
	static  nodes = [];
	static  nTyp =
		["    ", "t   ", "nt  ", "eps ", "alt ", "iter", "opt ","reru"];
	
	// constants for node kinds
	static t     =  1;  // terminal symbol
	 static nt    =  2;  // nonterminal symbol
	 static eps   =  3;  // empty
	 static alt   =  4;  // alternative: |
	 static iter  =  5;  // iteration: { }
	 static opt   =  6;  // option: [ ]
	 static rerun =  7;  // the optimization of: a {a} or a {b a}
	 static wrap  =  8;  // forces line break if found in the outer structure

	
	   n;			// node number
	   typ;		// t, nt, eps, alt, iter, opt, rerun
	   next;		// to successor node
	   down;		// alt: to next alternative
	   sub;		// alt, iter, opt: to first node of substructure
	   up;			// true: "next" leads to successor in enclosing structure
	   sym;		// nt, t: symbol represented by this node
	itergraph;	// rerun: points to the b in "a {b a}", null if "a {a}"
	   firstLevel; // true if the Node is in the first Level
	
	
	static trace=false;

	constructor( a, b ) {
		if( a instanceof Symbol ){
			this.typ = a.typ; this.sym = a; 
			this.n = Node.nodes.length;
			Node.nodes.push(this);
		}else if( typeof a === 'number' && b instanceof Node ){
			this.typ = a; 
			this.n = Node.nodes.length;
			Node.nodes.push(this);
			this.sub = b;
		}
	}

	//only for searching nt/t nodes
	static Find( name) {
		return Node.nodes.find( n=>n.sym != null && n.sym.name == name);
	}
	
	//can change the type of node from t to nt later on
	static terminalToNt( name)	{		
		Node.nodes.forEach( n=>{
			if( n.sym != null && n.sym.name == name) {
				n.typ = Node.nt;
			}
		});
	}
	
	//----------------- for printing ----------------------
	
	static #Ptr( p, up) {
		if (p == null) return 0; 
		else if (up) return -p.n;
		else return p.n;
	}
	
	
	static PrintNodes() {
		console.log("Graph nodes:");
		console.log("(S...Starting nodes)");
		console.log("--------------------------------------------");
		console.log("S   n type name          next  down   sub   ");
		console.log("--------------------------------------------");

		Node.nodes.forEach( p=>{

			let nt=false;
			let s = '';
			Symbol.nonterminals.forEach( s=>{
				if (s.graph.l.n == p.n) {
					s += ("*");
					nt=true;
				}
			})
			if(!nt) s += (" ");
			
			s += (String(p.n)).padStart(5, ' ') + nTyp[p.typ];
			
			if (p.sym != null)	s +=  p.sym.name; /* 12*/
			else s+=("             ");
			
			s+=(Ptr(p.next, p.up)); // 5 spaces
			
			switch (p.typ) {
				case Node.alt: case Node.iter: case Node.opt: case Node.rerun:
					s+= Ptr(p.down, false) + " " +  Ptr(p.sub, false); break;
				case eps: 
					s += ("           "); break;
			}
			console.log();
		} )
		console.log();
	}
	
	//----------------- for drawing ----------------------
	
	/**************default Settings**********************/
	static #showBorders				= false;					// show the rectangles around the components
	
	static  #defaultComponentArcSize	= 16;
	static  #defaultComponentGapWidth  	= 32;
	static  #defaultComponentGapHeight 	= 10;
	static  #defaultCharFont			= "20px mono";
	static  #defaultArrowSize			= 3;
	static  #defaultLinePen				= "#000";//new Pen(Color.Black,1);
	static  #defaultSymbolGapHeight 	= 0;
	static  #defaultCharColor			= "black";//Color.Black;
	static #defaultFontHeight = 20;
	
	/**********initialize variables with default settings***********/
	static  #componentArcSize 	= Node.#defaultComponentArcSize;			// size of the arcs
	static  #componentGapWidth 	= Node.#defaultComponentGapWidth;			// gap between subcomponent size and actual size
	static  #componentGapHeight	= Node.#defaultComponentGapHeight;		// gap between subcomponent size and actual size
	static  #charFont			= Node.#defaultCharFont;					// font of the t and nt symbols
	static  #arrowSize			= Node.#defaultArrowSize;					// size of the arrows
	static  #linePen			= Node.#defaultLinePen;					// color and thickness of the line
	static  #symbolGapHeight 	= Node.#defaultSymbolGapHeight;			// gap between the line of the symbol and the font
	static  #charColor			= Node.#defaultCharColor;					// fontColor of the T and NT symbols (fill style)
	static #fontHeight			= Node.#defaultFontHeight;		// needed to make the gap between the symbol and and the font possible
	static #optimizeGraph		= true;								// enable optimizations?
	
	/*****************other variables needed for the drawing********/
	size 		= new Size(0,0);			// the required size to draw the node
	altSize 	= new Size(0,0);			// the required size to draw a construct of alts or the size of the firstcomponent in the special rerun-node (itergraph!=null) 
	iterSize 	= new Size(0,0);			// the size of the second component in the special rerun Node (itergraph!=null)
		posBegin 	= new PointF(0,0);			// the point in the left above corner of the component
		posLine 	= new PointF(0,0);			// the point of the line of the component
		posEnd 		= new PointF(0,0);			// the point in the left down corner of the component	
	static #symbolSize 				= new Size(1,1);			// the total size of the current Rule
	static #beginningXCoordinate 	= 50;						// where the drawing starts (X)
	static #beginningYCoordinate 	= 40;						// where the drawing starts (Y)
	static canvas = document.createElement("canvas");
	static ctx = Node.canvas.getContext("2d");
	//static g						= EbnfForm.BitmapGraphics;  // the graphics object from the EBNFForm on witch the drawing takes place
	
	static set CharFont(value) {
			Node.#charFont=value;
			Node.ctx.font = value;
			//let fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
			//let actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
			const metrics = Node.ctx.measureText( "M" );
			let fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
			Node.#fontHeight=fontHeight+Node.#symbolGapHeight;
		}
	static get CharFont() {
			return Node.#charFont;
	}
	
	static set CharColor(value)  {
		Node.#charColor=value;
		}
	static get CharColor()  {
			return Node.#charColor;
	}
	
	static set ArrowSize(value)  {
		Node.#arrowSize=value;
		}
	static get ArrowSize()  {
			return Node.#arrowSize;
	}
	
	static set OptimizeGraph(value)  {
		Node.#optimizeGraph=value;
		}
	static get OptimizeGraph()  {
			return Node.#optimizeGraph;
	}
	
	static set SymbolGapHeight(value)  {
			Node.#symbolGapHeight=value;
		}
	static get SymbolGapHeight()  {
			return Node.#symbolGapHeight;
	}
	
	static set ComponentGapHeight(value)  {
			Node.#componentGapHeight=value;
			if(Node.#componentGapHeight/2+Node.#fontHeight/2<Node.#defaultComponentArcSize)
				Node.#componentArcSize=(Node.#componentGapHeight+Node.#fontHeight)/2;
			else
				Node.#componentArcSize=Node.#defaultComponentArcSize;
			if(Node.#componentArcSize%2!=0) Node.#componentArcSize-=1;
		}
	static get ComponentGapHeight()  {
			return Node.#componentGapHeight;
	}
	
	static  set ComponentGapWidth(value)  {
		Node.#componentGapWidth=value;
	}
	static  get ComponentGapWidth()  {
		return Node.#componentGapWidth;
	}
	
	static get LinePen() {
		return Node.#linePen;
	}
	static set LinePen(value) {
		Node.#linePen=value;
	}
	
	static get SymbolSize() {
		return Node.#symbolSize;
	}
	
	static restoreDefaultSettings() {
		Node.#componentArcSize 	= Node.#defaultComponentArcSize;			// size of the arcs
		Node.#componentGapWidth 	= Node.#defaultComponentGapWidth;			// gap between subcomponent size and actual size
		Node.#componentGapHeight	= Node.#defaultComponentGapHeight;		// gap between subcomponent size and actual size
		Node.#charFont			= Node.#defaultCharFont;					// font of the t and nt symbols
		Node.#arrowSize			= Node.#defaultArrowSize;					// size of the arrows
		Node.#linePen				= Node.#defaultLinePen;			// color and thickness of the line
		Node.#symbolGapHeight 	= Node.#defaultSymbolGapHeight;			// gap between the line of the symbol and the font
		Node.#charColor			= Node.#defaultCharColor;					// fontColor of the T and NT symbols
		console.log( "Hard coded height" );

		Node.#fontHeight		= 13;//Node.#defaultCharFont.Height;		// needed to make the gap between the symbol and and the font possible
		Node.#optimizeGraph		= true;
	}
	
	static calcDrawing()	{
		Symbol.nonterminals.forEach( s=>{
			s.graph.graphSize=s.graph.l.calcSize();
			s.graph.l.setWrapSize();
			s.graph.l.calcPos(Node.#beginningYCoordinate);
			if(Node.trace) {
				PrintNodes();
				Console.WriteLine("\n\n"+s.graph.graphSize.ToString());
			}
		})
	}
	
	// calculates the size if there are wraps in the rule
	setWrapSize() {
		let n=this;
		let maxH=0;
		while(n!=null) {
			n.firstLevel=true;
			if(n.typ==Node.wrap)	{
				n.size.Height=maxH;
				maxH=0;
			}
			else {
				if(n.typ==Node.iter) {
					if(maxH<n.size.Height+(Node.#fontHeight+Node.#componentGapHeight)/2)
						maxH=n.size.Height+(Node.#fontHeight+Node.#componentGapHeight)/2;
					
				}
				else if(maxH<n.size.Height || maxH<n.altSize.Height) {
					if(n.altSize.Height!=0)
						maxH=n.altSize.Height;
					else
						maxH=n.size.Height;
				}				
			}
		n=n.next;
		}
	}
	
	// calculates the size of each symbol
	calcSize()	{
		let n=this; 							//current node in the level
		let s=new Size();						//alt,iter,opt: size of current construct
		let iterCompensation=0;
		let samelevel=true;					//next node in same level?
		let realHeight=n.calcHeight();
		let maxTotalSize=new Size(0,0);
		while(n!=null && samelevel)	{
			
			if(n.typ==Node.t || n.typ==Node.nt) {
				//Node.ctx.font;;
				const metric = Node.ctx.measureText( n.sym.name );

				n.size.Height =Node.#fontHeight+Node.#componentGapHeight;
				n.size.Width = metric.width+Node.#fontHeight/3;//g.MeasureString(n.sym.name,charFont).Width+Node.#fontHeight/3;

				if(!n.up && n.next!=null && n.next.typ==Node.wrap && n.next.size.Height==0) {
					if(!n.next.up && n.next.next!=null && (n.next.next.typ==Node.t || n.next.next.typ==Node.nt)) {
						s.Width+=Node.#componentGapWidth/2;
					}	
				}
				if(!n.up && n.next!=null && (n.next.typ==Node.t || n.next.typ==Node.nt)) {
					s.Width+=Node.#componentGapWidth/2;
				}
			}
			else if(n.typ==Node.eps)	{
				
				n.size.Height = Node.#fontHeight+Node.#componentGapHeight;
				n.size.Width = Node.#componentGapWidth;
			}
			else if(n.typ==Node.opt)	{		
				n.size=n.sub.calcSize();			
				n.size.Width  += Node.#componentGapWidth*2;
				n.size.Height += Node.#componentGapHeight/2;
			}			
			else if(n.typ==Node.iter)	{	
				n.size=n.sub.calcSize();
				n.size.Width  += Node.#componentGapWidth*2;
			}
			else if(n.typ==Node.wrap)	{	
				maxTotalSize.Height+=s.Height-Node.#componentGapHeight/2;
				if(maxTotalSize.Width<s.Width)
					maxTotalSize.Width=s.Width;
				s.Height=0;
				s.Width=0;
			}
			else if(n.typ==Node.rerun)	{	
				n.size=n.sub.calcSize();
				if(n.itergraph!=null) {
					n.altSize=n.size;
					if(n.size.Width<n.itergraph.calcSize().Width)
						n.size.Width=n.itergraph.calcSize().Width;
					n.size.Height+=n.itergraph.calcSize().Height;
					n.iterSize=n.itergraph.calcSize();
				}
				else
					n.size.Height += Node.#componentGapHeight/2;	
				n.size.Width  += Node.#componentGapWidth*2;
			}
			else if(n.typ==Node.alt)	{			
				let a=n;let maxH= -Node.#componentGapHeight, maxW=0;
				while(a!=null)	{				
					a.size=a.sub.calcSize();				
					maxH += a.size.Height;
					if(a.size.Width>maxW) maxW=a.size.Width;
					a=a.down;
					
				}
				if(n.sub.typ==Node.iter && realHeight!=0) maxH+=(Node.#fontHeight+Node.#componentGapHeight)/2;
				maxW += 2*Node.#componentGapWidth;
				maxH += Node.#componentGapHeight;
				
				n.altSize.Height=maxH;
				n.altSize.Width=maxW;			
			}
			if(n.typ==Node.iter&&realHeight!=0) {
				iterCompensation=(Node.#fontHeight+Node.#componentGapHeight)/2;
			}
			if(n.typ==Node.alt)	{
				if(s.Height<n.altSize.Height) s.Height=n.altSize.Height;
				s.Width += n.altSize.Width;
			} else {
				if(s.Height<n.size.Height) s.Height=n.size.Height;
				s.Width += n.size.Width;
			}
			if(n.typ==Node.iter) {
				if(s.Height<n.size.Height+iterCompensation) 	s.Height=n.size.Height+iterCompensation;
			}
			if(n.up) {
				samelevel=false;
			}
			n=n.next;

		}
		if(maxTotalSize.Width!=0) {
			maxTotalSize.Height+=s.Height-Node.#componentGapHeight/2;
			if(maxTotalSize.Width<s.Width)
				maxTotalSize.Width=s.Width;
			return maxTotalSize;
		}
		else
			return s;
	}
	
	// calculates the total height of all symbols wich are in the same horizontal level
	calcHeight()	{
		let n=this; 							//current node in the level
		let realHeight=0;
		let samelevel=true;					//next node in same level?
		while(n!=null && samelevel)	{
			if(n.typ==Node.nt|| n.typ==Node.t)  {
				if(realHeight<n.size.Height)
					realHeight=n.size.Height;
			}
			else if(n.typ==Node.iter) {
				let tmpHeight=0;
				if(realHeight<tmpHeight)
					realHeight=tmpHeight;				
			}
			else if(n.typ==Node.opt||n.typ==Node.rerun ) {
				let tmpHeight=n.sub.calcHeight();
				if(realHeight<tmpHeight){}
					realHeight=tmpHeight;
			}
			else if(n.typ==Node.alt ) {
				let tmpHeight=n.sub.calcHeight();
				if(realHeight<tmpHeight){}
					realHeight=tmpHeight;				
			}
			else if(n.typ==Node.eps) {
				if(realHeight<Node.#fontHeight*3/2)
					realHeight=Node.#fontHeight+Node.#componentGapHeight;
			}
			if(n.up) {
				samelevel=false;
			}
			n=n.next;
		}
		return realHeight;
	}
	
	
	// calcualtes the horizontal position of the symbols
	calcPos( posBegin)	{
		let n=this; 							//current node in the level
		let realHeight=this.calcHeight();
		let samelevel=true;					//next node in same level?
		while(n!=null && samelevel)	{
			if(n.typ==Node.nt||n.typ==Node.t)  {
				n.posLine.Y=posBegin+realHeight/2;
				n.posBegin.Y=n.posLine.Y-(n.size.Height-Node.#componentGapHeight)/2;
				n.posEnd.Y=n.posLine.Y+(n.size.Height-Node.#componentGapHeight)/2;
			}
			else if(n.typ==Node.eps)	{
				n.posLine.Y=posBegin+n.size.Height/2;
				n.posBegin.Y=posBegin;
				n.posEnd.Y=posBegin+n.size.Height;
			}
			else if(n.typ==Node.opt)	{		
				n.posLine.Y=posBegin+realHeight/2;
				n.posBegin.Y=posBegin;
				n.posEnd.Y=posBegin+n.size.Height;
				n.sub.calcPos(n.posBegin.Y);
			}
			else if(n.typ==Node.rerun)	{		
				n.posLine.Y=posBegin+realHeight/2;
				n.posBegin.Y=posBegin;
				n.posEnd.Y=posBegin+n.size.Height;
				if(n.itergraph!=null) {
					n.itergraph.calcPos(posBegin+n.altSize.Height);
				}
				n.sub.calcPos(n.posBegin.Y);
			}
			else if(n.typ==Node.iter)	{
				if(realHeight==0) {
					n.posLine.Y=posBegin+realHeight/2;
					n.posBegin.Y=posBegin;
					n.posEnd.Y=posBegin+n.size.Height;
				}
				else {
					n.posLine.Y=posBegin+realHeight/2;
					n.posBegin.Y=posBegin+(Node.#fontHeight+Node.#componentGapHeight)/2;
					n.posEnd.Y=n.posBegin.Y+n.size.Height;	
				}
				n.sub.calcPos(n.posLine.Y);
			}
			else if(n.typ==Node.wrap && this.firstLevel) {
				n.posLine.Y=posBegin+realHeight/2;
				n.posEnd.Y=posBegin+n.size.Height;
				posBegin=posBegin+n.size.Height;
				
			}
			else if(n.typ==Node.alt)	{
				n.posLine.Y=posBegin+realHeight/2;
				n.posBegin.Y=posBegin;
				n.posEnd.Y=posBegin+n.altSize.Height;
				if(n.sub.typ==Node.iter && n.calcHeight()!=0 &&n.altSize.Height!=0)
					posBegin+=(Node.#fontHeight+Node.#componentGapHeight)/2;
				n.sub.calcPos(posBegin);
				if(n.down!=null) {
					n.down.calcPos(posBegin+n.size.Height);
				}
				if(n.sub.typ==Node.iter && n.calcHeight()!=0 &&n.altSize.Height!=0)
				posBegin-=(Node.#fontHeight+Node.#componentGapHeight)/2;
			}
			if(n.up) {
				samelevel=false;
			}
			n=n.next;
		}
	}
	
	// starts to draw the rule at the given symbol s
	static drawComponent(s, canvas, vg)	{
		if(s!=null)	{
			Node.#symbolSize=new Size(s.graph.graphSize.Width+Node.#beginningXCoordinate+Node.#componentGapWidth*2,s.graph.graphSize.Height+Node.#beginningYCoordinate+Node.#componentGapHeight*2+5);
			
			//EbnfForm.Drawarea=new Bitmap(Node.SymbolSize.Width,Node.SymbolSize.Height,	System.Drawing.Imaging.PixelFormat.Format24bppRgb);
			
			//decide either draw on visualized bitmap or record a metafile
			if(vg!=null) {
				canvas.width = Node.#symbolSize.Width;
				canvas.height = Node.#symbolSize.Height;
	
				//Node.#g=vg;
				//vg.fillStyle = "white";
				vg.clearRect( 0, 0, Node.#symbolSize.Width, Node.#symbolSize.Height);
				vg.lineWidth = 2;
				Node.ctx = vg;
				//g.FillRectangle(new SolidBrush(Color.White),0,0,symbolSize.Width,symbolSize.Height);
			}
			//else g=EbnfForm.BitmapGraphics;

			let p=new PointF(Node.#beginningXCoordinate,Node.#beginningYCoordinate-30);
			//g.DrawString(s.name,new Font("Times New Roman",14),new SolidBrush(Color.Black),p.X-20,p.Y);
			Node.ctx.beginPath();
			Node.ctx.fillStyle = "black";
			Node.ctx.font = "14px Times New Roman";
			Node.ctx.fillText( s.name, p.X-20, p.Y);
			////Node.DrawRectangle(new Pen(Color.Orange,2),p.X,p.Y+30,s.graph.graphSize.Width,s.graph.graphSize.Height);
			//Node.ctx.strokeStyle = Graph.#lightPen;
			Node.ctx.moveTo(Node.#beginningXCoordinate-Node.#componentGapWidth/4-Node.#componentArcSize/2 	, s.graph.l.posLine.Y  );
			Node.ctx.lineTo(Node.#beginningXCoordinate, s.graph.l.posLine.Y);
			Node.ctx.stroke();
			//Node.DrawLine(linePen ,Node.#beginningXCoordinate-Node.#componentGapWidth/4-componentArcSize/2 	, s.graph.l.posLine.Y 	, Node.#beginningXCoordinate	, s.graph.l.posLine.Y	);
			s.graph.l.drawComponents(p,s.graph.graphSize);
			
		}
	}

	
	// draws arrows for different directions
	static drawArrow( pen, x,  y,  x1,  y1,  direction) {
		Node.ctx.beginPath();
		Node.ctx.moveTo(x, y);
		Node.ctx.lineTo(x1, y1);
		Node.ctx.stroke();
		//Node.DrawLine(pen,x,y,x1,y1);
		let arrowHead	 = new PointF(x1,y1);
		let arrowLeft;	 
		let arrowRight;
		if(direction=="right") {
			arrowLeft	= new PointF(x1-Node.#arrowSize*2,y1-Node.#arrowSize);
			arrowRight  = new PointF(x1-Node.#arrowSize*2,y1+Node.#arrowSize);
			//let curvePoints = [arrowHead,arrowLeft,arrowRight];
			Node.ctx.beginPath();
			Node.ctx.moveTo(arrowHead.X, arrowHead.Y);
			Node.ctx.lineTo(arrowRight.X, arrowRight.Y);
			Node.ctx.lineTo(arrowLeft.X, arrowLeft.Y);
			Node.ctx.closePath();
			Node.ctx.fill();
			//g.FillPolygon(pen.Brush, curvePoints);
		}else if(direction=="up") {
			arrowLeft	= new PointF(x1-Node.#arrowSize,y1+Node.#arrowSize*2);
			arrowRight  = new PointF(x1+Node.#arrowSize,y1+Node.#arrowSize*2);
			//let curvePoints = [arrowHead,arrowLeft,arrowRight];
			Node.ctx.beginPath();
			Node.ctx.moveTo(arrowHead.X, arrowHead.Y);
			Node.ctx.lineTo(arrowLeft.X, arrowLeft.Y);
			Node.ctx.lineTo(arrowRight.X, arrowRight.Y);
			Node.ctx.closePath();
			Node.ctx.fill();
		}else if(direction=="left") {
			arrowLeft	= new PointF(x1+Node.#arrowSize*2,y1+Node.#arrowSize);
			arrowRight  = new PointF(x1+Node.#arrowSize*2,y1-Node.#arrowSize);
			//let curvePoints = [arrowHead,arrowLeft,arrowRight];
			Node.ctx.beginPath();
			Node.ctx.moveTo(arrowHead.X, arrowHead.Y);
			Node.ctx.lineTo(arrowLeft.X, arrowLeft.Y);
			Node.ctx.lineTo(arrowRight.X, arrowRight.Y);
			Node.ctx.closePath();
			Node.ctx.fill();
		}else if(direction=="down") {
			arrowLeft	= new PointF(x1-Node.#arrowSize,y1-Node.#arrowSize*2);
			arrowRight  = new PointF(x1+Node.#arrowSize,y1-Node.#arrowSize*2);
			//let curvePoints = [arrowHead,arrowLeft,arrowRight];
			Node.ctx.beginPath();
			Node.ctx.moveTo(arrowHead.X, arrowHead.Y);
			Node.ctx.lineTo(arrowLeft.X, arrowLeft.Y);
			Node.ctx.lineTo(arrowRight.X, arrowRight.Y);
			Node.ctx.closePath();
			Node.ctx.fill();
		}
	}
	
	/*
	 * Draws the components from left to right.
	 * Rekursive procedure. Therefore also the drawComponentsInverse procedure is used.
	 * Each component paints itself and then they give their coordinates to its innercomponents.
	*/

	static DrawRectangle( pen, x, y, width, height) {
		Node.ctx.beginPath();
		Node.ctx.strokeStyle = pen;
		Node.ctx.rect(x, y, width, height);
		Node.ctx.stroke();
	
	}

	static DrawLine( pen, x, y, width, height) {

		Node.ctx.beginPath();
		Node.ctx.strokeStyle = pen;
		Node.ctx.moveTo(x, y);
		Node.ctx.lineTo( width, height);
		Node.ctx.stroke();
	
	}
	static DrawArc( pen, x, y, width, height, startAngle, endAngle) {
		Node.ctx.beginPath();
		Node.ctx.strokeStyle = pen;
		Node.ctx.arc(x+width/2, y+height/2, width/2, startAngle/180*Math.PI, (startAngle+endAngle)/180*Math.PI );
		Node.ctx.stroke();
	}

	static DrawString( s, font, color, rect, format) {
		Node.ctx.beginPath();
		Node.ctx.fillStyle = color;
		Node.ctx.font = font;
		Node.ctx.fillText( s, rect.X + 2, rect.Y+rect.Height-Node.#symbolGapHeight);
		Node.ctx.stroke();
}

	drawComponents( p, s)	{
		let n=this; 							// current node in the level
		let samelevel=true;					// next node in same level?
		let p1=new Point(0,0);				// needed for calculating the X-Coordinate for the recursion				
		
		while(n!=null && samelevel)	{
			
			if(n.typ==Node.t || n.typ==Node.nt) {
				if(Node.#showBorders) {
					
					Node.DrawRectangle("Palegreen",p.X,n.posBegin.Y-Node.#componentGapHeight/2,n.size.Width,n.size.Height);
				}
				
				if(n.typ==Node.t) {
					// the quarter Arcs
					Node.DrawArc( Node.#linePen , p.X													, n.posBegin.Y	, (n.size.Height-Node.#componentGapHeight)/2 , (n.size.Height-Node.#componentGapHeight)/2 , 180 , 90);
					Node.DrawArc( Node.#linePen , p.X													, n.posLine.Y	, (n.size.Height-Node.#componentGapHeight)/2 , (n.size.Height-Node.#componentGapHeight)/2 ,  90 , 90);
					Node.DrawArc( Node.#linePen , p.X+n.size.Width-(n.size.Height-Node.#componentGapHeight)/2	, n.posBegin.Y	, (n.size.Height-Node.#componentGapHeight)/2 , (n.size.Height-Node.#componentGapHeight)/2 , 270 , 90);
					Node.DrawArc( Node.#linePen , p.X+n.size.Width-(n.size.Height-Node.#componentGapHeight)/2	, n.posLine.Y	, (n.size.Height-Node.#componentGapHeight)/2 , (n.size.Height-Node.#componentGapHeight)/2 ,   0 , 90);
					// the short vertical and horizontal lines between the quarter Arcs
					Node.DrawLine(Node.#linePen , p.X+(n.size.Height-Node.#componentGapHeight)/4-1	, n.posBegin.Y 											, p.X+n.size.Width-(n.size.Height-Node.#componentGapHeight)/4+1	, n.posBegin.Y										);
					Node.DrawLine(Node.#linePen , p.X+(n.size.Height-Node.#componentGapHeight)/4-1	, n.posEnd.Y 											, p.X+n.size.Width-(n.size.Height-Node.#componentGapHeight)/4+1	, n.posEnd.Y										);
					Node.DrawLine(Node.#linePen , p.X										, n.posLine.Y+(n.size.Height-Node.#componentGapHeight)/4+1 	, p.X														, n.posLine.Y-(n.size.Height-Node.#componentGapHeight)/4-1);
					Node.DrawLine(Node.#linePen , p.X+n.size.Width							, n.posLine.Y+(n.size.Height-Node.#componentGapHeight)/4+1 	, p.X+n.size.Width											, n.posLine.Y-(n.size.Height-Node.#componentGapHeight)/4-1);
				}
				else {
					n.posBegin.X=p.X;
					n.posEnd.X=p.X+n.size.Width;
					Node.DrawRectangle(Node.#linePen , n.posBegin.X , n.posBegin.Y , n.size.Width , (n.size.Height-Node.#componentGapHeight));
				}
				//let drawFormat  = new StringFormat();
				//drawFormat.Alignment 	 = StringAlignment.Center;
				//drawFormat.LineAlignment = StringAlignment.Center;
				Node.DrawString(n.sym.name , Node.#charFont , Node.#charColor , new Rectangle(p.X,n.posBegin.Y,n.size.Width,n.size.Height-Node.#componentGapHeight-2));
				Node.drawArrow(Node.#linePen , p.X , n.posLine.Y , p.X , n.posLine.Y , "right");
				p.X+=n.size.Width;
				// draw lines between t and nt nodes
				if(!n.up && n.next!=null && (n.next.typ==Node.t || n.next.typ==Node.nt)) {
					Node.drawArrow(Node.#linePen , p.X , n.posLine.Y , p.X+Node.#componentGapWidth/2 , n.posLine.Y , "right");
					p.X+=Node.#componentGapWidth/2;
				}
				if(!n.up && n.next!=null && n.next.typ==Node.wrap && n.next.size.Height==0) {
					Node.drawArrow(Node.#linePen , p.X , n.posLine.Y , p.X+Node.#componentGapWidth/2 , n.posLine.Y , "right");
					p.X+=Node.#componentGapWidth/2;					
				}
			}
			else if(n.typ==Node.eps) {
				if(Node.#showBorders) Node.DrawRectangle("DarkKhaki",p.X,n.posBegin.Y,n.size.Width,n.size.Height);
				
				Node.DrawLine(Node.#linePen , p.X , n.posLine.Y , p.X+n.size.Width , n.posLine.Y);

			}
			else if(n.typ==Node.opt)	{
				if(Node.#showBorders) Node.DrawRectangle("DarkKhaki",p.X,n.posBegin.Y,n.size.Width,n.size.Height);
				
				// the two short lines at the beginning and the end
				Node.DrawLine(Node.#linePen , p.X				, n.posLine.Y , p.X				+Node.#componentGapWidth	, n.posLine.Y);
				Node.DrawLine(Node.#linePen , p.X +n.size.Width	, n.posLine.Y , p.X+n.size.Width-Node.#componentGapWidth	, n.posLine.Y);
				// the quarter Arcs
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 - Node.#componentArcSize/2					 , n.posLine.Y										, Node.#componentArcSize , Node.#componentArcSize , 270 , 90);
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					 , n.posEnd.Y-Node.#componentArcSize-Node.#componentGapHeight/2	, Node.#componentArcSize , Node.#componentArcSize ,  90 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2	  + n.size.Width , n.posLine.Y										, Node.#componentArcSize , Node.#componentArcSize , 180 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize*3/2 + n.size.Width , n.posEnd.Y-Node.#componentArcSize-Node.#componentGapHeight/2	, Node.#componentArcSize , Node.#componentArcSize ,   0 , 90);
				// the short vertical lines between the quarter Arcs
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posLine.Y+Node.#componentArcSize/2 	, p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posEnd.Y-Node.#componentArcSize/2-Node.#componentGapHeight/2+1);
				Node.DrawLine(Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2 + n.size.Width	, n.posLine.Y+Node.#componentArcSize/2 	, p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2 + n.size.Width		, n.posEnd.Y-Node.#componentArcSize/2-Node.#componentGapHeight/2+1);
				// the the long horizontal line between the quarter Arcs					
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize					, n.posEnd.Y-Node.#componentGapHeight/2	, p.X - Node.#componentGapWidth/4 - Node.#componentArcSize	 + n.size.Width+1	, n.posEnd.Y-Node.#componentGapHeight/2 				  	  );

				p1.X=p.X+Node.#componentGapWidth;
				n.sub.drawComponents(p1,n.size);
				p.X+=n.size.Width;
			}
			else if(n.typ==Node.rerun&&n.itergraph==null)	{
				if(Node.#showBorders) Node.DrawRectangle("green",p.X,n.posBegin.Y,n.size.Width,n.size.Height);
				
				// the two short lines at the beginning and the end
				Node.DrawLine(Node.#linePen , p.X				, n.posLine.Y , p.X					+Node.#componentGapWidth	, n.posLine.Y);
				Node.DrawLine(Node.#linePen , p.X +n.size.Width	, n.posLine.Y , p.X+n.size.Width	-Node.#componentGapWidth	, n.posLine.Y);
				// the quarter Arcs
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.posEnd.Y-Node.#componentGapHeight/2-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,  90 , 90);
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.posLine.Y										, Node.#componentArcSize , Node.#componentArcSize , 180 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.posEnd.Y-Node.#componentGapHeight/2-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,   0 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.posLine.Y										, Node.#componentArcSize , Node.#componentArcSize , 270 , 90);
				// the short vertical lines between the quarter Arcs
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posLine.Y+Node.#componentArcSize/2  , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posEnd.Y-Node.#componentGapHeight/2-Node.#componentArcSize/2+1 );
				Node.DrawLine(Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2+n.size.Width 	, n.posLine.Y+Node.#componentArcSize/2  , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2+ n.size.Width 	, n.posEnd.Y-Node.#componentGapHeight/2-Node.#componentArcSize/2+1 );
				// the the long horizontal line between the quarter Arcs					
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize-1					, n.posEnd.Y-Node.#componentGapHeight/2 , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize  + n.size.Width+1	, n.posEnd.Y-Node.#componentGapHeight/2);
				
				p1.X=p.X+Node.#componentGapWidth;
				n.sub.drawComponents(p1,n.size);
				p.X+=n.size.Width;
			}
			else if(n.typ==Node.rerun&&n.itergraph!=null) {
				if(Node.#showBorders) Node.DrawRectangle("Fuchsia",p.X,n.posBegin.Y,n.size.Width,n.size.Height);

				// the two short lines at the beginning and the end of the first Node.#component
				Node.DrawLine(Node.#linePen , p.X													, n.posLine.Y , p.X + n.size.Width/2-n.altSize.Width/2-1	, n.posLine.Y);
				Node.DrawLine(Node.#linePen , p.X + n.size.Width/2+n.altSize.Width/2+1				, n.posLine.Y , p.X + n.size.Width						, n.posLine.Y);
				// the quarter Arcs
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.itergraph.posLine.Y-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,  90 , 90);
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.posLine.Y								, Node.#componentArcSize , Node.#componentArcSize , 180 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.itergraph.posLine.Y-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,   0 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.posLine.Y								, Node.#componentArcSize , Node.#componentArcSize , 270 , 90);
				// the short vertical lines between the quarter Arcs
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posLine.Y+Node.#componentArcSize/2 	, p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2			   , n.itergraph.posLine.Y-Node.#componentArcSize/2+1	);
				Node.DrawLine(Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2+n.size.Width 	, n.posLine.Y+Node.#componentArcSize/2 	, p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2+ n.size.Width , n.itergraph.posLine.Y-Node.#componentArcSize/2+1	);
				// the two short lines at the beginning and the end of the second Node.#component					
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize	, n.itergraph.posLine.Y	, p.X + n.size.Width/2-n.iterSize.Width/2-1						, n.itergraph.posLine.Y	);
				Node.DrawLine(Node.#linePen , p.X + n.size.Width/2+n.iterSize.Width/2+1		, n.itergraph.posLine.Y	, p.X - Node.#componentGapWidth/4 - Node.#componentArcSize + n.size.Width+1	, n.itergraph.posLine.Y	);
				
				n.itergraph.drawComponentsInverse(new PointF(p.X + n.size.Width/2+n.iterSize.Width/2 , n.posEnd.Y) , n.size);
				n.sub.drawComponents(			  new PointF(p.X + n.size.Width/2-n.altSize.Width /2 , n.posEnd.Y) , n.size);
				p.X+=n.size.Width;				
			}
			else if(n.typ==Node.iter)	{	
				if(Node.#showBorders) Node.DrawRectangle("DarkViolet",p.X,n.posBegin.Y,n.size.Width,n.size.Height);
				
				// the quarter Arcs
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.sub.posLine.Y-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,  90 , 90);
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.posLine.Y						, Node.#componentArcSize , Node.#componentArcSize , 180 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.sub.posLine.Y-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,   0 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.posLine.Y						, Node.#componentArcSize , Node.#componentArcSize , 270 , 90);
				// the short vertical lines between the quarter Arcs
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posLine.Y+Node.#componentArcSize/2	, p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2				, n.sub.posLine.Y-Node.#componentArcSize/2+1	);
				Node.DrawLine(Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2 + n.size.Width	, n.posLine.Y+Node.#componentArcSize/2 	, p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2 + n.size.Width	, n.sub.posLine.Y-Node.#componentArcSize/2+1	);
				// the two short horizontal lines between the quater Arcs and the Node.#components
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize-1	, n.sub.posLine.Y 			, p.X + Node.#componentGapWidth										, n.sub.posLine.Y );
				Node.DrawLine(Node.#linePen , p.X - Node.#componentGapWidth   + n.size.Width		, n.sub.posLine.Y			, p.X + n.size.Width-Node.#componentGapWidth/4 - Node.#componentArcSize+1	, n.sub.posLine.Y );
				// the long horizontal line in the middle
				Node.DrawLine(Node.#linePen , p.X , n.posLine.Y , p.X + n.size.Width , n.posLine.Y);
	
				p1.X=p.X-Node.#componentGapWidth+n.size.Width;
				n.sub.drawComponentsInverse(p1,n.size);
				p.X+=n.size.Width;
			}
			else if(n.typ==Node.wrap && n.size.Height!=0 && n.next!=null) {
				
				// the short horizontal line after the first Node.#component
				Node.DrawLine(Node.#linePen , p.X 					, n.posLine.Y		, p.X + Node.#componentGapWidth/4+1				, n.posLine.Y		);
				// the short horizontal line at the beginning of the second Node.#component
				Node.DrawLine(Node.#linePen , Node.#beginningXCoordinate  	, n.next.posLine.Y	, Node.#beginningXCoordinate-Node.#componentGapWidth/4	, n.next.posLine.Y	);				
				// the quarter Arcs
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4-Node.#componentArcSize/2					, n.posLine.Y						, Node.#componentArcSize , Node.#componentArcSize ,  270 , 90);
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4-Node.#componentArcSize/2					, n.posEnd.Y-Node.#componentArcSize		, Node.#componentArcSize , Node.#componentArcSize ,    0 , 90);
				Node.DrawArc( Node.#linePen , Node.#beginningXCoordinate-Node.#componentGapWidth/4-Node.#componentArcSize/2	, n.posEnd.Y						, Node.#componentArcSize , Node.#componentArcSize ,  180 , 90);
				Node.DrawArc( Node.#linePen , Node.#beginningXCoordinate-Node.#componentGapWidth/4-Node.#componentArcSize/2	, n.next.posLine.Y-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,   90 , 90);
				// the short vertical lines between the quarter Arcs
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4+Node.#componentArcSize/2					, n.posLine.Y+Node.#componentArcSize/2	, p.X + Node.#componentGapWidth/4+Node.#componentArcSize/2					, n.posEnd.Y-Node.#componentArcSize/2			+1	);
				Node.DrawLine(Node.#linePen , Node.#beginningXCoordinate-Node.#componentGapWidth/4-Node.#componentArcSize/2	, n.posEnd.Y+Node.#componentArcSize/2		, Node.#beginningXCoordinate-Node.#componentGapWidth/4-Node.#componentArcSize/2	, n.next.posLine.Y-Node.#componentArcSize/2	+1	);
				// the long horizontal line in the middle oft the two Node.#components
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4+1 									, n.posEnd.Y 						, Node.#beginningXCoordinate-Node.#componentGapWidth/4 						, n.posEnd.Y								);
	
				p.X=Node.#beginningXCoordinate;
			}
			else if(n.typ==Node.alt)	{			
				if(Node.#showBorders) Node.DrawRectangle("Red",p.X,n.posBegin.Y,n.altSize.Width,n.altSize.Height);
				
				// the two short lines at the beginning and the end of the altNode.#component
				Node.DrawLine(	Node.#linePen , p.X				 		, n.posLine.Y , p.X					+Node.#componentArcSize*3/2		, n.posLine.Y	);
				Node.DrawLine(	Node.#linePen , p.X+n.altSize.Width		, n.posLine.Y , p.X+n.altSize.Width -+Node.#componentArcSize*3/2		, n.posLine.Y	);
				let a=n;
				let first=true;
				while(a!=null)	{				
					// the horizontal lines at the beginning and the end
					Node.DrawLine( Node.#linePen , p.X +Node.#componentArcSize*3/2 						, a.sub.posLine.Y , p.X	+(n.altSize.Width-a.size.Width)/2					, a.sub.posLine.Y);
					Node.DrawLine( Node.#linePen , p.X -Node.#componentArcSize*3/2	+ n.altSize.Width+1		, a.sub.posLine.Y , p.X	+(n.altSize.Width-a.size.Width)/2 + a.size.Width	, a.sub.posLine.Y);
					// the first alternative draws different arcs
					if(first) {
						Node.DrawArc ( Node.#linePen , p.X   									, n.posLine.Y							, Node.#componentArcSize , Node.#componentArcSize , 270 , 90);
						Node.DrawArc ( Node.#linePen , p.X  +n.altSize.Width-Node.#componentArcSize 	, n.posLine.Y							, Node.#componentArcSize , Node.#componentArcSize , 180 , 90);
						first=false;
					}
					// else draw other arcs and vertical lines
					else {
						Node.DrawArc ( Node.#linePen , p.X  + Node.#componentArcSize   					, a.sub.posLine.Y-Node.#componentArcSize		, Node.#componentArcSize 			, Node.#componentArcSize , 90 , 90);
						Node.DrawLine( Node.#linePen , p.X  + Node.#componentArcSize   					, n.posLine.Y +Node.#componentArcSize/2		, p.X  + Node.#componentArcSize 						, a.posLine.Y-Node.#componentArcSize/2+1);
						Node.DrawArc ( Node.#linePen , p.X  - Node.#componentArcSize*2 + n.altSize.Width 	, a.sub.posLine.Y - Node.#componentArcSize	, Node.#componentArcSize 			, Node.#componentArcSize , 0 , 90);
						Node.DrawLine( Node.#linePen , p.X  - Node.#componentArcSize + n.altSize.Width  	, n.posLine.Y +Node.#componentArcSize/2		, p.X  - Node.#componentArcSize + n.altSize.Width 	, a.posLine.Y-Node.#componentArcSize/2+1);
					}
					a.sub.drawComponents(new PointF(p.X+(n.altSize.Width-a.size.Width)/2 , a.posEnd.Y) , a.size);
					a=a.down;
				}
				p.X+=n.altSize.Width;
			}

			if(n.up)
				samelevel=false;
			if(n.next==null && this.firstLevel) {
				Node.DrawLine( Node.#linePen , p.X   							, n.posLine.Y , p.X+Node.#componentGapWidth/4 		  , n.posLine.Y			 );
				Node.drawArrow(	Node.#linePen , p.X+Node.#componentGapWidth/4+Node.#arrowSize , n.posLine.Y , p.X+Node.#componentGapWidth/4+Node.#arrowSize , n.posLine.Y , "right");
			}
			n=n.next;
		}
	}
	
	/*
	 * Draw the Node.#components from right to left.
	 * Needed if for example in an iter-node.
	 */
	 drawComponentsInverse( p, s)	{
		let n=this; 							//current node in the level
		let samelevel=true;					//next node in same level?
		let p1=new Point(0,0);				

				
		while(n!=null && samelevel)	{
			p.X-=n.size.Width;
			if(n.typ==Node.t || n.typ==Node.nt) {
				if(Node.#showBorders) Node.DrawRectangle("PaleGreen",p.X,n.posBegin.Y-Node.#componentGapHeight/2,n.size.Width,n.size.Height);
				if(n.typ==Node.t) {
					// the quarter Arcs
					Node.DrawArc( Node.#linePen , p.X													, n.posBegin.Y	, (n.size.Height-Node.#componentGapHeight)/2 , (n.size.Height-Node.#componentGapHeight)/2 , 180 , 90);
					Node.DrawArc( Node.#linePen , p.X													, n.posLine.Y	, (n.size.Height-Node.#componentGapHeight)/2 , (n.size.Height-Node.#componentGapHeight)/2 ,  90 , 90);
					Node.DrawArc( Node.#linePen , p.X+n.size.Width-(n.size.Height-Node.#componentGapHeight)/2	, n.posBegin.Y	, (n.size.Height-Node.#componentGapHeight)/2 , (n.size.Height-Node.#componentGapHeight)/2 , 270 , 90);
					Node.DrawArc( Node.#linePen , p.X+n.size.Width-(n.size.Height-Node.#componentGapHeight)/2	, n.posLine.Y	, (n.size.Height-Node.#componentGapHeight)/2 , (n.size.Height-Node.#componentGapHeight)/2 ,   0 , 90);
					// the short vertical and horizontal lines between the quarter Arcs
					Node.DrawLine(Node.#linePen , p.X+(n.size.Height-Node.#componentGapHeight)/4-1	, n.posBegin.Y 											, p.X+n.size.Width-(n.size.Height-Node.#componentGapHeight)/4+1	, n.posBegin.Y										);
					Node.DrawLine(Node.#linePen , p.X+(n.size.Height-Node.#componentGapHeight)/4-1	, n.posEnd.Y 											, p.X+n.size.Width-(n.size.Height-Node.#componentGapHeight)/4+1	, n.posEnd.Y										);
					Node.DrawLine(Node.#linePen , p.X										, n.posLine.Y+(n.size.Height-Node.#componentGapHeight)/4+1 	, p.X														, n.posLine.Y-(n.size.Height-Node.#componentGapHeight)/4-1);
					Node.DrawLine(Node.#linePen , p.X+n.size.Width							, n.posLine.Y+(n.size.Height-Node.#componentGapHeight)/4+1 	, p.X+n.size.Width											, n.posLine.Y-(n.size.Height-Node.#componentGapHeight)/4-1);
				}
				else {
					n.posBegin.X=p.X;
					n.posEnd.X=p.X+n.size.Width;
					Node.DrawRectangle(Node.#linePen , n.posBegin.X,n.posBegin.Y , n.size.Width , (n.size.Height-Node.#componentGapHeight));
				}
				//let drawFormat  = "";//new StringFormat();
				//drawFormat.Alignment 	 = StringAlignment.Center;
				//drawFormat.LineAlignment = StringAlignment.Center;
				Node.DrawString(n.sym.name , Node.#charFont , Node.#charColor , new Rectangle(p.X,n.posBegin.Y,n.size.Width,n.size.Height-Node.#componentGapHeight-2)/*,drawFormat*/);

				Node.drawArrow(Node.#linePen , p.X+n.size.Width , n.posLine.Y , p.X+n.size.Width , n.posLine.Y , "left");
				
				if(!n.up && n.next!=null && (n.next.typ==Node.t || n.next.typ==Node.nt)) {
					Node.drawArrow(Node.#linePen , p.X , n.posLine.Y , p.X-Node.#componentGapWidth/2 , n.posLine.Y , "left");
					p.X-=Node.#componentGapWidth/2;
				}
				if(!n.up && n.next!=null && n.next.typ==Node.wrap && n.next.size.Height==0) {
					if(!n.next.up && n.next.next!=null && (n.next.next.typ==Node.t || n.next.next.typ==Node.nt)) {
						Node.drawArrow(Node.#linePen , p.X , n.posLine.Y , p.X-Node.#componentGapWidth/2 , n.posLine.Y , "left");
						p.X-=Node.#componentGapWidth/2;
					}
				}
			}
			else if(n.typ==Node.eps)	{
				if(Node.#showBorders) Node.DrawRectangle("DarkKhaki",p.X,n.posBegin.Y,n.size.Width,n.size.Height);
				
				Node.DrawLine(Node.#linePen , p.X , n.posLine.Y , p.X + n.size.Width , n.posLine.Y);

			}
			else if(n.typ==Node.opt)	{
				if(Node.#showBorders) Node.DrawRectangle("DarkKhaki",p.X,n.posBegin.Y,n.size.Width,n.size.Height);

				// the two short lines at the beginning and the end
				Node.DrawLine(Node.#linePen , p.X				, n.posLine.Y , p.X				+Node.#componentGapWidth	, n.posLine.Y);
				Node.DrawLine(Node.#linePen , p.X +n.size.Width	, n.posLine.Y , p.X+n.size.Width-Node.#componentGapWidth	, n.posLine.Y);
				// the quarter Arcs
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 - Node.#componentArcSize/2					 , n.posLine.Y										, Node.#componentArcSize , Node.#componentArcSize , 270 , 90);
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					 , n.posEnd.Y-Node.#componentArcSize-Node.#componentGapHeight/2	, Node.#componentArcSize , Node.#componentArcSize ,  90 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2	  + n.size.Width , n.posLine.Y										, Node.#componentArcSize , Node.#componentArcSize , 180 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize*3/2 + n.size.Width , n.posEnd.Y-Node.#componentArcSize-Node.#componentGapHeight/2	, Node.#componentArcSize , Node.#componentArcSize ,   0 , 90);
				// the short vertical lines between the quarter Arcs
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posLine.Y+Node.#componentArcSize/2 	, p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posEnd.Y-Node.#componentArcSize/2-Node.#componentGapHeight/2+1);
				Node.DrawLine(Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2 + n.size.Width	, n.posLine.Y+Node.#componentArcSize/2 	, p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2 + n.size.Width		, n.posEnd.Y-Node.#componentArcSize/2-Node.#componentGapHeight/2+1);
				// the the long horizontal line between the quarter Arcs					
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize					, n.posEnd.Y-Node.#componentGapHeight/2	, p.X - Node.#componentGapWidth/4 - Node.#componentArcSize	 + n.size.Width+1	, n.posEnd.Y-Node.#componentGapHeight/2 				  	  );

				p1.X=p.X+n.size.Width-Node.#componentGapWidth;
				n.sub.drawComponentsInverse(p1,n.size);
			}			
			
			else if(n.typ==Node.rerun && n.itergraph==null)	{
				if(Node.#showBorders) Node.DrawRectangle("green",p.X,n.posBegin.Y,n.size.Width,n.size.Height);

				// the two short lines at the beginning and the end
				Node.DrawLine(Node.#linePen , p.X				, n.posLine.Y , p.X					+Node.#componentGapWidth	, n.posLine.Y);
				Node.DrawLine(Node.#linePen , p.X +n.size.Width	, n.posLine.Y , p.X+n.size.Width	-Node.#componentGapWidth	, n.posLine.Y);
				// the quarter Arcs
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.posEnd.Y-Node.#componentGapHeight/2-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,  90 , 90);
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.posLine.Y										, Node.#componentArcSize , Node.#componentArcSize , 180 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.posEnd.Y-Node.#componentGapHeight/2-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,   0 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.posLine.Y										, Node.#componentArcSize , Node.#componentArcSize , 270 , 90);
				// the short vertical lines between the quarter Arcs
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posLine.Y+Node.#componentArcSize/2  , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posEnd.Y-Node.#componentGapHeight/2-Node.#componentArcSize/2+1 );
				Node.DrawLine(Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2+n.size.Width 	, n.posLine.Y+Node.#componentArcSize/2  , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2+ n.size.Width 	, n.posEnd.Y-Node.#componentGapHeight/2-Node.#componentArcSize/2+1 );
				// the the long horizontal line between the quarter Arcs					
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize-1					, n.posEnd.Y-Node.#componentGapHeight/2 , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize  + n.size.Width+1	, n.posEnd.Y-Node.#componentGapHeight/2);
				
				p1.X=p.X+n.size.Width-Node.#componentGapWidth;
				n.sub.drawComponentsInverse(p1,n.size);
			}
			else if(n.typ==Node.rerun&&n.itergraph!=null) {
				if(Node.#showBorders) Node.DrawRectangle("Fuchsia",p.X,n.posBegin.Y,n.size.Width,n.size.Height);

				// the two short lines at the beginning and the end of the first Node.#component
				Node.DrawLine(Node.#linePen , p.X													, n.posLine.Y , p.X + n.size.Width/2-n.altSize.Width/2-1, n.posLine.Y);
				Node.DrawLine(Node.#linePen , p.X + n.size.Width/2+n.altSize.Width/2+1				, n.posLine.Y , p.X + n.size.Width						, n.posLine.Y);
				// the quarter Arcs
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.itergraph.posLine.Y-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,  90 , 90);
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.posLine.Y								, Node.#componentArcSize , Node.#componentArcSize , 180 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.itergraph.posLine.Y-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,   0 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.posLine.Y								, Node.#componentArcSize , Node.#componentArcSize , 270 , 90);
				// the short vertical lines between the quarter Arcs
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posLine.Y+Node.#componentArcSize/2 	, p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2			   , n.itergraph.posLine.Y-Node.#componentArcSize/2+1	);
				Node.DrawLine(Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2+n.size.Width 	, n.posLine.Y+Node.#componentArcSize/2 	, p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2+ n.size.Width , n.itergraph.posLine.Y-Node.#componentArcSize/2+1	);
				// the two short lines at the beginning and the end of the second Node.#component					
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize	, n.itergraph.posLine.Y	, p.X + n.size.Width/2-n.iterSize.Width/2-1						, n.itergraph.posLine.Y	);
				Node.DrawLine(Node.#linePen , p.X + n.size.Width/2+n.iterSize.Width/2+1		, n.itergraph.posLine.Y	, p.X - Node.#componentGapWidth/4 - Node.#componentArcSize + n.size.Width+1	, n.itergraph.posLine.Y	);
				
				n.sub.drawComponentsInverse(new PointF(p.X+n.size.Width/2+n.altSize.Width/2  , n.posEnd.Y),n.size);
				n.itergraph.drawComponents( new PointF(p.X+n.size.Width/2-n.iterSize.Width/2 , n.posEnd.Y),n.size);
			
			}
			else if(n.typ==Node.iter)	{	
				if(Node.#showBorders) Node.DrawRectangle("DarkViolet",p.X,n.posBegin.Y,n.size.Width,n.size.Height);
				
				// the quarter Arcs
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.sub.posLine.Y-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,  90 , 90);
				Node.DrawArc( Node.#linePen , p.X + Node.#componentGapWidth/4 +Node.#componentArcSize/2					, n.posLine.Y						, Node.#componentArcSize , Node.#componentArcSize , 180 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.sub.posLine.Y-Node.#componentArcSize	, Node.#componentArcSize , Node.#componentArcSize ,   0 , 90);
				Node.DrawArc( Node.#linePen , p.X - Node.#componentGapWidth/4 -Node.#componentArcSize*3/2 + n.size.Width	, n.posLine.Y						, Node.#componentArcSize , Node.#componentArcSize , 270 , 90);
				// the short vertical lines between the quarter Arcs
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2					, n.posLine.Y+Node.#componentArcSize/2	, p.X + Node.#componentGapWidth/4 + Node.#componentArcSize/2				, n.sub.posLine.Y-Node.#componentArcSize/2+1	);
				Node.DrawLine(Node.#linePen , p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2 + n.size.Width	, n.posLine.Y+Node.#componentArcSize/2 	, p.X - Node.#componentGapWidth/4 - Node.#componentArcSize/2 + n.size.Width	, n.sub.posLine.Y-Node.#componentArcSize/2+1	);
				// the two short horizontal lines between the quater Arcs and the Node.#components
				Node.DrawLine(Node.#linePen , p.X + Node.#componentGapWidth/4 + Node.#componentArcSize-1	, n.sub.posLine.Y 			, p.X + Node.#componentGapWidth										, n.sub.posLine.Y );
				Node.DrawLine(Node.#linePen , p.X - Node.#componentGapWidth   + n.size.Width		, n.sub.posLine.Y			, p.X + n.size.Width-Node.#componentGapWidth/4 - Node.#componentArcSize+1	, n.sub.posLine.Y );
				// the long horizontal line in the middle
				Node.DrawLine(Node.#linePen , p.X , n.posLine.Y , p.X + n.size.Width , n.posLine.Y);	
				
				p1.X=p.X+Node.#componentGapWidth;
				n.sub.drawComponents(p1,n.size);
			}
			else if(n.typ==Node.alt)	{			
				p.X-=n.altSize.Width-n.size.Width;
				if(Node.#showBorders) Node.DrawRectangle("Red",p.X,n.posBegin.Y,n.altSize.Width,n.altSize.Height);
				
				// the two short lines at the beginning and the end of the altNode.#component
				Node.DrawLine(	Node.#linePen , p.X				 		, n.posLine.Y , p.X					+Node.#componentArcSize*3/2		, n.posLine.Y	);
				Node.DrawLine(	Node.#linePen , p.X+n.altSize.Width		, n.posLine.Y , p.X+n.altSize.Width -Node.#componentArcSize*3/2		, n.posLine.Y	);
				p1.X=p.X+2*Node.#componentGapWidth;
				p1.Y=p1.Y+Node.#componentGapHeight;
				let a=n;
				let first=true;
				while(a!=null)	{				

					// the horizontal lines at the beginning and the end
					Node.DrawLine( Node.#linePen , p.X +Node.#componentArcSize*3/2 					, a.sub.posLine.Y , p.X	+(n.altSize.Width-a.size.Width)/2					, a.sub.posLine.Y);
					Node.DrawLine( Node.#linePen , p.X -Node.#componentArcSize*3/2	+ n.altSize.Width+1	, a.sub.posLine.Y , p.X	+(n.altSize.Width-a.size.Width)/2 + a.size.Width	, a.sub.posLine.Y);
					// if the first Alternative draw differnt Arcs
					if(first) {
						Node.DrawArc ( Node.#linePen , p.X   									, n.posLine.Y							, Node.#componentArcSize , Node.#componentArcSize , 270 , 90);
						Node.DrawArc ( Node.#linePen , p.X  +n.altSize.Width-Node.#componentArcSize 	, n.posLine.Y							, Node.#componentArcSize , Node.#componentArcSize , 180 , 90);
						first=false;
					}
					// else draw other Arcs and vertical lines
					else {
						Node.DrawArc ( Node.#linePen , p.X  + Node.#componentArcSize   					, a.sub.posLine.Y-Node.#componentArcSize		, Node.#componentArcSize 			, Node.#componentArcSize , 90 , 90);
						Node.DrawLine( Node.#linePen , p.X  + Node.#componentArcSize   					, n.posLine.Y +Node.#componentArcSize/2		, p.X  + Node.#componentArcSize 						, a.posLine.Y-Node.#componentArcSize/2+1);
						Node.DrawArc ( Node.#linePen , p.X  - Node.#componentArcSize*2 + n.altSize.Width 	, a.sub.posLine.Y - Node.#componentArcSize	, Node.#componentArcSize 			, Node.#componentArcSize , 0 , 90);
						Node.DrawLine( Node.#linePen , p.X  - Node.#componentArcSize + n.altSize.Width  	, n.posLine.Y +Node.#componentArcSize/2		, p.X  - Node.#componentArcSize + n.altSize.Width 	, a.posLine.Y-Node.#componentArcSize/2+1);
					}
					let pf=new PointF(p.X+(n.altSize.Width+a.size.Width)/2,p1.Y);
					a.sub.drawComponentsInverse(pf,a.size);
					a=a.down;
				}
			}
			if(n.up)
				samelevel=false;
			n=n.next;
		}
	}

	//----------------- for optimizing ----------------------
	
	//compare two nodes on the basis of structure and value
	static  Compare( n1, n2)	{
		if(n1.typ==n2.typ) {
			if(n1.typ==Node.nt || n1.typ==Node.t)	{
				if(n1.sym.name!=n2.sym.name) return false;
			}
			return true;
		}
		return false;
	}
	
	/*
	 * compare two graphs on the basis of structure and value
	 * if untilIter is set, n1 and n2 are treated in a different way:
	 * the graph n1 to the iter node is compared to the iter subnode
	 * params: n1 must be the node before iter if untilIter==true
	 * params: n2 must be the first subnode of iter if untilIter==true
	 */
	static  DeepCompare( n1, n2, untilIter)	{
		let samelevel=true;
		let identifier=n2;							//helps to identify the relevant iter node
		while(n1!=null && samelevel)	{
			//just compare nodes until the iter node
			if(untilIter)	{
				if(n1.typ==Node.iter && n1.sub==identifier) {
					if(n1==n2) {	//last iter node's next points to the iter
						if(Node.trace) Console.WriteLine("true: iter node reached, graphs match");
						return true;
					} else	{
						if(Node.trace) Console.WriteLine("false: iter node reached, graphs do not match");
						return false;
					}
				}			
			}
			if(n2==null) {
				if(Node.trace) Console.WriteLine("false: second enclosing substructure ended before first");
				return false;
			}			
			if(!Node.Compare(n1,n2)) {
				if(Node.trace) Console.WriteLine("false: node not same type/content");
				return false;
			} 
			//--> t,nt,eps is ok, go to next
			
			if(n1.typ==Node.opt|| n1.typ==Node.iter || n1.typ==Node.rerun)	{		
				if(!Node.DeepCompare(n1.sub, n2.sub,false)) {
					if(Node.trace) Console.WriteLine("false: false in subelem of iter,opt or rerun");
					return false;
				}
				if(n1.typ==Node.rerun && !Node.DeepCompare(n1.itergraph, n2.itergraph, false))	{
				   if(Node.trace) Console.WriteLine("false: itergraph of rerun doesn't match");
				   return false;
				}
			}			
			else if(n1.typ==Node.alt)	{			
				let a1=n1,a2=n2;
				while(a1!=null)	{
					if(a2==null) {
						if(Node.trace) Console.WriteLine("false: false in subalt, second node null");
						return false;
					}
					
					if(!Node.DeepCompare(a1.sub,a2.sub,false)) {
						if(Node.trace) Console.WriteLine("false: false in subelem of subalt");
						return false;
					}
					a1=a1.down;
					a2=a2.down;
				}
				if(a2!=null) {
					if(Node.trace) Console.WriteLine("false: second alt has more alternatives");
					return false;
				}
			}
			if(n1.up) {
				if(!n2.up) {
					if(Node.trace) Console.WriteLine("false: second has not finished enclosing structure");
					return false;
				}
				samelevel=false;
			}	
			n1=n1.next;
			n2=n2.next;
		}
		if(n1==null && n2!=null) {
			if(Node.trace) Console.WriteLine("false: first enclosing substructure ended before second");
			return false;
		}
		return true;
	}
	
	//calls all methods which optimize the graphs
	static  Optimize()	{
		Symbol.nonterminals.forEach( s => {
			Node.RemoveWrongLinebreaks(s.graph.l,null,s);
			if(Node.#optimizeGraph) Node.#RemoveRedundancy(s.graph.l,null,s); 	//remove redundant iter/opts
			if(Node.#optimizeGraph) Node.#RemoveEps(s.graph.l,null,s); 		//remove eps nodes and redundant eps nodes in alternatives
			if(Node.#optimizeGraph) Node.OptimizeIter(s.graph.l,null,s);			
		})
	}
	
	
	//removes all unnecessary and wrong linebreaks (wrap-nodes) from the graph
	static RemoveWrongLinebreaks(n, parent, s)	{
		let samelevel=true;
		let i=n;
		while(i!=null && samelevel)	{
			if(i.typ==Node.wrap)	{
				//if in outer structure, just remove multiple wraps
				if(parent==null) {
					while(i.next!=null && i.next.typ==Node.wrap)	{
						i.next=i.next.next;
					}
				} //if in inner structure remove it
				else {
					//if \n is first element of substructure
					if(n==i) {
						//parent==null doesn't occur
						
						//if \n is the only subelement
						if(i.up ||i.next==null) {
							let eps=new Node(Node.eps, null);
							parent.sub=eps;
							eps.up=i.up;
							eps.next=i.next;
							n=eps;
						} else {
							parent.sub=i.next;
							n=parent.sub;						
						}
					} else { //if within substructure
						let j=n;
						while(j.next!=i) j=j.next;
						j.next=i.next;
						j.up=i.up;
					}
				}
			}
			else if(i.typ==Node.opt || i.typ==Node.iter || i.typ==Node.rerun)
				Node.RemoveWrongLinebreaks(i.sub,i,s);
			
			else if(i.typ==Node.alt)	{			
				let a=i;
				while(a!=null)	{
					
					Node.RemoveWrongLinebreaks(a.sub,a,s);
					a=a.down;
				}
			}

			if(i.up) {
				samelevel=false;
			}	
			i=i.next;
		}
	
	}


	static #RemoveRedundancy( n, parent, s)	{
		let samelevel=true;		//next node in same level?
		let begin=n;
		while(n!=null && samelevel)	{
			
			if(n.typ==Node.alt)	{
				let a=n;
				while(a!=null)	{
					Node.#RemoveRedundancy(a.sub,a,s);
					a=a.down;
				}
			} 
			else if(n.typ==Node.iter)	{
				while((n.sub.typ==Node.iter || n.sub.typ==Node.opt) && n.sub.up)	{
					//EbnfForm.WriteLine("Rendundant "+Node.nTyp[n.sub.typ]+" Node removed (iter).");
					n.sub=n.sub.sub;
					let i=n.sub;
					while(!i.up)	{
						i=i.next;
					}
					i.next=n;							
				}
				Node.#RemoveRedundancy(n.sub,n,s);
			
			} else if(n.typ==Node.opt)	{
				let containsIter=false;
				while((n.sub.typ==Node.opt && (n.sub.up || n.sub.next==null)) || (n.sub.typ==Node.iter && (n.sub.up || n.sub.next==null)))	{
					//if(n.sub.typ==Node.opt || containsIter) EbnfForm.WriteLine("Rendundant "+Node.nTyp[n.sub.typ]+" Node removed (opt).");
					if(n.sub.typ==Node.iter) containsIter=true;
					n.sub=n.sub.sub;					
				}
				if(containsIter)	{
					let iter=new Node(Node.iter,n.sub);
					iter.next=n.next;
					if(n==begin)	{
						if(parent==null)	{ 
							s.graph.l=iter;
						} else {
							parent.sub=iter;
						}
					} else {
						let j=begin;
						while(j.next!=n)	{
							j=j.next;
						}
						j.next=iter;
					}
					n=iter;
					
					//set correct next pointer of last subelement of new iter
					let i=iter.sub;
					while(i.next!=null && !i.up) i=i.next;
					i.next=iter;
				}			
				Node.#RemoveRedundancy(n.sub,n,s);
			}			
			if(n.up) samelevel=false;
			n=n.next;
		}
		
		
	}

	static #RemoveEps( n, parent, s)	{
		let samelevel=true;		//next node in same level?
		let begin=n;
		while(n!=null && samelevel)	{
			
			if(n.typ==Node.eps)	{
				if(n==begin)	{
					if(parent==null)	{
						//if the graph only consists of an eps, let it live
						if(n.next!=null) {
							s.graph.l=n.next;
							begin=n.next;
						}
					} //else: at beginning of substructure not required (iter/opt/alt subnodes were already handled)
				} else	{
					let i=begin;
					while(i.next!=n)	{
						i=i.next;
					}
					i.next=n.next;
					i.up=n.up;
				}
			}
			else if(n.typ==Node.iter || n.typ==Node.opt)	{
				if(n.sub.typ==Node.eps && (n.sub.next==null || n.sub.up)) {
					if(n==begin)	{
						if(parent==null)	{ //beginning of graph
							//if graph only consists of this iter/opt, then replace it with an eps node
							if(n.next==null) {
								let eps=new Node(Node.eps, null);
								s.graph.l=eps;
								s.graph.r=eps;
							} else { //remove that node
								s.graph.l=n.next;
								begin=n.next;
								
							}
						} //else: at beginning of substructure not required (iter/opt/alt subnodes were already handled)
					} else { //within substructure
						let i=begin;
						while(i.next!=n) {
							i=i.next;
						}
						if(n.up) i.up=true;
						i.next=n.next;
					}
				} else Node.#RemoveEps(n.sub,n,s);

			}
			else if(n.typ==Node.alt)	{
				let a=n;
				//count number of eps
				let numOfEps=0;
				while(a!=null)	{	
					//Node.#CheckSubAlts(a);
					if(a.sub.typ==Node.eps && (a.sub.next==null || a.sub.up))	numOfEps++;
					a=a.down;
				}
				a=n;
				while(numOfEps>1)	{
					if(n!=a && a.sub.typ==Node.eps && (a.sub.next==null || a.sub.up)) {
						let i=n;
						while(i.down!=a)	{
							i=i.down;
						}
						i.down=a.down;
						numOfEps--;
					}
					a=a.down;
				}
				Node.#RemoveSameAlts(n);
				Node.#PutEpsAtBeginningOfAlt(begin,n,parent,s);
				//optimize subcomponents
				a=n;
				while(a!=null)	{
					//if not the left eps node
					if(!(a.sub.typ==Node.eps && (a.sub.next==null || a.sub.up))) Node.#RemoveEps(a.sub,a,s);
					a=a.down;
				}
			}
			if(n.up) samelevel=false;
			n=n.next;
		}
	}
	
	
	//removes all empty iter/opt nodes in alternatives, as well as multiple eps nodes at the beginning:
	//they would bug a condition in RemoveEps
	static #CheckSubAlts( alt)	{

		//remove all empty iter/opts
		//make sure, that at least one eps Node will exist
		let eps=new Node(Node.eps,null);
		eps.next=alt.sub;
		alt.sub=eps;
		let i=alt.sub;
		let samelevel=true;
		while(i!=null && samelevel)	{
			//if empty iter/opt
			if((i.typ==Node.iter || i.typ==Node.opt) && i.sub.typ==Node.eps && (i.sub.next==null || i.sub.up))	{
				//case i==alt.sub not possible
				let a=alt.sub;
				while(a.next!=i) a=a.next;
				a.next=i.next;				
			}
			if(i.up) samelevel=false;
			i=i.next;
		}
		
		i=alt.sub;
		//remove multiple eps nodes at the beginning
		if(i.typ==Node.eps) {
			while(i.next!=null && !i.next.up && i.next.typ==Node.eps) {
				i.next=i.next.next;
			}
		}
	}
	static #RemoveSameAlts( alt)	{
		let a=alt;
		while(a!=null)	{
			let i=a.down;
			while(i!=null)	{
				if(Node.DeepCompare(a.sub,i.sub,false))	{
					let n=a;
					while(n.down!=i) n=n.down;
					n.down=i.down;
				}			
				i=i.down;
			}		
			a=a.down;
		}
	}
	static #PutEpsAtBeginningOfAlt(n, alt, parent, s)	{
		let a=alt;
		let containsEps=false;
		
		
		//determine if eps is contained
		while(a!=null)	{
			//if eps node
			if(a.sub.typ==Node.eps && (a.sub.next==null || a.sub.up))	containsEps=true;		
			a=a.down;
		}
		if(containsEps)	{
			//remove eps node
			a=alt;
			while(a!=null)	{
				//if eps node
				if(a.sub.typ==Node.eps && (a.sub.next==null || a.sub.up))	{
					//remove eps only if within alternatives
					if(a!=alt)	{
						let i=alt;
						while(i.down!=a) i=i.down;
						i.down=a.down;
					}
					break; //there can be only one eps in the alts because same nodes have already been removed
				}
				a=a.down;
			}
			//insert eps, if first alt isn't eps
			
			if(!(alt.sub.typ==Node.eps && (alt.sub.next==null || alt.sub.up))) {
				let eps=new Node(Node.eps,null);
				eps.next=alt.next;
				eps.up=true;
				let a1= new Node(Node.alt,eps);
				a1.down=alt;
				if(alt==n)	{
					if(parent==null)	s.graph.l=a1;
					else parent.sub=a1;			
				} else {
					let i=n;
					while (i.next!=alt) i=i.next;
					i.next=a1;
				}
				a1.next=alt.next;
				a1.up=alt.up;
				alt.next=null;

			}
			
			
		}
		
		
	}
		
		
		

	

	
	
	//optimizes enclosing structures and recursively its substructures
	static  OptimizeIter( n, parent, s)	{
		
		let samelevel=true;		//next node in same level?
		let i=n;
		
		
		while(i!=null && samelevel)	{
			if(i.typ==Node.opt) Node.OptimizeIter(i.sub,i,s);
			else if(i.typ==Node.alt) {
				let a=i;
				while(a!=null)	{
					Node.OptimizeIter(a.sub,a,s);
					a=a.down;
				}			
			}
			else if(i.typ==Node.iter) {
				//first optimize the iter substructure
				Node.OptimizeIter(i.sub,i,s);
				
				//while loop to DeepCompare from every node until the iter node
				let j=n;
				let matchFound=false;
				while(j!=i && !matchFound)	{
					let k=i.sub;
					let samelevel2=true;
					while(k!=null && samelevel2 && !matchFound)	{
						if(Node.DeepCompare(j,k,true)) {
							//EbnfForm.WriteLine("Iter node optimized.");
							matchFound=true;
							//replace the iter node and the nodes before by the rerun node
							let re= new Node(Node.rerun, k);
							if(j==n) {
								
								if(parent==null) {
									s.graph.l=re;
									n=re;
								}
								else {
									parent.sub=re;
									n=re;
								}
							} else {
								let l=n;
								while(l.next!=j)	l=l.next;
								l.next=re;
							}
	
							//if a {b a} isolate b
							if(k!=i.sub)	{
								re.itergraph=i.sub;
								let temp=re.itergraph;
								while(temp.next!=k) temp=temp.next;
								temp.next=null;
							}
							
							re.next=i.next;
							re.up=i.up;
							i=re;
						
						}
						if(k.up) samelevel2=false;
						k=k.next;
						
					}

					j=j.next;
				}			
			}		
			if(i.up) samelevel=false;
			i=i.next;
		}
	}
}


export class Graph {
	
	 l=null;	// left end of graph = head
	 r=null;	// right end of graph = list of nodes to be linked to successor graph
	 graphSize = {width:0,height:0};
	
	constructor(a, b) {
		if( a && a instanceof Node && b && b instanceof Node) (this.l=a),(this.r=b);
		else if(a && a instanceof Node) this.l=this.r=a;
		else  this.l = this.r = null;
	}
	

	static MakeFirstAlt( g) {
		g.l = new Node(Node.alt, g.l); 
		g.l.next = g.r;
		g.r = g.l;
	}
	
	 static MakeAlternative( g1, g2) {
		g2.l = new Node(Node.alt, g2.l);
		let p = g1.l; while (p.down != null) p = p.down;
		p.down = g2.l;
		p = g1.r; while (p.next != null) p = p.next;
		p.next = g2.r;
	}
	
	 static MakeSequence( g1, g2) {
		if(g1.l==null && g1.r==null) {/*case: g1 is empty */
			g1.l=g2.l;g1.r=g2.r;
		} else {
			
			let p = g1.r.next; g1.r.next = g2.l; // link head node
			while (p != null) {  // link substructure
				let q = p.next; p.next = g2.l; p.up = true;
				p = q;
			}
			g1.r = g2.r;
		}
	}
	
	static MakeIteration( g) {
		g.l = new Node(Node.iter, g.l);
		let p = g.r;
		g.r = g.l;
		while (p != null) {
			let q = p.next; p.next = g.l; p.up = true;
			p = q;
		}
	}
	
	static MakeOption( g) {
		g.l = new Node(Node.opt, g.l);
		g.l.next = g.r;
		g.r = g.l;
	}
	
	static Finish( g) {
		let p = g.r;
		while (p != null) {
			let q = p.next; p.next = null; p = q;
		}
	}
		
}

