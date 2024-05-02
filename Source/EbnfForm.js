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

import {popups} from "/node_modules/@d3x0r/popups/popups.mjs";
popups.utils.preAddPopupStyles( document.head, location.href )
import {Node,Symbol} from "./Graph.js"
import {Scanner} from "./Scanner.js"
import {Parser} from "./Parser.js"

export class EbnfForm 	{

	 textBoxOutput	= document.createElement( "span" );
	 //DrawArea			= new Bitmap(1,1,System.Drawing.Imaging.PixelFormat.Format24bppRgb);  // make a persistent drawing area
	
	 currentSymbol			= null;
	menu = popups.createMenu( { keepOpen: true });
	
	constructor()	{
		this.menu.show();
		loadFile.addEventListener('click', ()=> {
			const form = popups.simpleForm( "Paste EBNF", "EBNF", `Rule1 = begin [optional things] end.
Rule2 = begin {and again} end.
Rule3 = I am a (good | bad) programmer.
Linebreak = First line \n Second line \n End.
Optimize1 = ab {ab}.
Optimize2 = ab { cd ab}.
Quote = "'" a "'".`
			, (data)=> {
				this.LoadGrammar( data );
				form.remove();
			}, ()=>{form.remove()} );
			form.show();
		} );
		//this.AutoScaleBaseSize = new System.Drawing.Size(5, 13); 
		//this.ClientSize = new System.Drawing.Size(800, 600);
		//this.StartPosition = FormStartPosition.CenterScreen;
		//this.Text = "EBNF Visualizer";
		//this.Name = "EBNF Visualizer";
		//this.Paint += new PaintEventHandler(component_paint);
		//this.BackColor=Color.White;
		//this.MouseDown += new System.Windows.Forms.MouseEventHandler(this.Form_MouseDown);	
		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext('2d');

		document.body.appendChild( this.canvas );
		document.body.appendChild( this.textBoxOutput );

		//this.paint();
		// get string from somewhere...

	}

	
	///////////////////////////////////////////////////////////////////////////////
	//-----------About menu form + eventhandler------------------------------------
	///////////////////////////////////////////////////////////////////////////////
	
	///////////////////////////////////////////////////////////////////////////////
	//-----------Methods for initialising and organising the draw area-------------
	///////////////////////////////////////////////////////////////////////////////
	
	paint() {
		Node.drawComponent(this.currentSymbol);
		//let xGraph;
		//xGraph = e.Graphics;
		//xGraph.DrawImage(DrawArea,0,0,DrawArea.Width,DrawArea.Height);
	}
	
	drawGrammar()	{
		EbnfForm.InitializeDrawArea();
		Node.calcDrawing();
		if( this.currentSymbol ) {

			Node.drawComponent(this.currentSymbol, this.canvas,this.ctx );
		}
		//this.Refresh();
	}

	static InitializeDrawArea(){
		//let xGraph;
		//xGraph = Graphics.FromImage(DrawArea);
		//xGraph.Clear(Color.White);	// clear the drawing area to background color
	}
	
	SetCurrentSymbol( s ) {
		EbnfForm.rulehistory.length = 0;
		//menuItemRules.MenuItems.forEach( mi=>	{
		//	mi.Checked=false;
		//})

		//MenuItem temp=(MenuItem) sender;
		//temp.Checked=true;
		//menuItemSave.Enabled=true;
		//menuItemCopy.Enabled=true;
		this.currentSymbol=s;//Symbol.Find(temp.Text);
		EbnfForm.rulehistory.push(this.currentSymbol);
		this.drawGrammar();
		EbnfForm.WriteLine("Switched to rule: "+this.currentSymbol.name+".");
    }
	
	///////////////////////////////////////////////////////////////////////////////
	//-----------Load functionality - Loading Grammar, creating short paths--------
	///////////////////////////////////////////////////////////////////////////////

	short_path_existing=false;
	LoadFile( path)	{
		if(!short_path_existing)	{
			let line=new MenuItem("-");
			menuItemFile.MenuItems.Add(6,line);
			short_path_existing=true;
		}
		
		let existing=false;
		menuItemFile.MenuItems.forEach( mi=>	{
			if(mi.Text==path)	existing=true;
			mi.Checked=false;
		})
		if(!existing){
			let grammar=new MenuItem(path);
			menuItemFile.MenuItems.Add(6,grammar);
			grammar.Click+=new System.EventHandler(this.shortload_Click);
		}
		LoadGrammar(path);
	}
	 
	LoadGrammar( path) {
		//put shortcut in menu to top position
		/*
		menuItemFile.MenuItems.find( mi=>{
			mi.Checked=false;
			if(mi.Text==path)	{
				mi.Index=6;
				mi.Checked=true;
				return true;
				////break;
			}
			return false;
		} )
		*/
		// Clear the existing nodes and symbols
		Symbol.nonterminals=[];//new ArrayList();
		Symbol.terminals=[];//new ArrayList();
		Node.nodes=[];//new ArrayList();
		this.currentSymbol=null;
		//menuItemRules.MenuItems.Clear();
		EbnfForm.rulehistory.length = 0;//Clear();
		
		Scanner.Init(path);
		Parser.Parse();
		Node.Optimize();

		let i;
		let insert;
		this.menu.reset();
		Symbol.nonterminals.forEach( s=>{
			this.menu.addItem( s.name, ()=> {
				this.SetCurrentSymbol( s );
			} );

			/*
			let m=new MenuItem(s.name);
			i=0;
			insert=false;
			menuItemRules.MenuItems.find( mi=>	{

				if(m.Text.CompareTo(mi.Text)>0) {
					i++;
				} else {
					menuItemRules.MenuItems.Add(i,m);
					insert=true;
					return true;
				}
				return false;
			})
			if(i>0 && !insert) menuItemRules.MenuItems.Add(i,m);
			if(menuItemRules.MenuItems.Count==0)	{
				menuItemRules.MenuItems.Add(m);
			}
			m.Click+= new System.EventHandler(this.SetCurrentSymbol);
			*/
		})
		//menuItemRules.Enabled=true;
		this.menu.show();
		this.drawGrammar();
		EbnfForm.WriteLine("New grammar loaded.");
	}
	
	///////////////////////////////////////////////////////////////////////////////
	//-----------Mousecontrol + Nonterminalsearch for cruise on click--------------
	///////////////////////////////////////////////////////////////////////////////
	
	static rulehistory = [];
	
	Form_MouseDown() {
            // Update the mouse path with the mouse information
            if(currentSymbol==null) return;
            let nt=null;
            
            if(e.Button==MouseButtons.Left) nt=FindNT(this.currentSymbol.graph.l,new PointF(e.X, e.Y));
            if(e.Button==MouseButtons.Right && EbnfForm.rulehistory.length>1) {
            	EbnfForm.rulehistory.pop();
            	let s= EbnfForm.rulehistory[EbnfForm.rulehistory.length-1];
            	SwitchToRule(s);
            }
            
            
	}
	SwitchToRule( s) {
		this.currentSymbol=s;			
		drawGrammar();
		//EbnfForm.WriteLine("Switched to rule: "+s.name+".");
		//foreach(MenuItem mi in menuItemRules.MenuItems)	{			
		//	mi.Checked=false;	
		//	if(mi.Text==s.name) mi.Checked=true;
		//}
	}
	
	FindNT( n, p)	{
		let samelevel=true;
			
		while(n!=null && samelevel)	{
			if(n.typ==Node.nt)	{
				if(p.X >= n.posBegin.X && p.X <= n.posEnd.X && p.Y >= n.posBegin.Y && p.Y <= n.posEnd.Y) {
					SwitchToRule(n.sym);
					EbnfForm.rulehistory.push(n.sym);
				}
			}
			
			else if(n.typ==Node.opt|| n.typ==Node.iter || n.typ==Node.rerun)	{		
				let i=FindNT(n.sub,p);
				if(i!=null) return i;
				if(n.typ==Node.rerun && n.itergraph!=null) FindNT(n.itergraph,p);

			}			
			else if(n.typ==Node.alt)	{			
				let a=n;
				while(a!=null)	{
					let i=FindNT(a.sub,p);
					if(i!=null) return i;				
					
					a=a.down;
				}

			}
			if(n.up) {
				samelevel=false;
			}	
			n=n.next;
		}
		return null;		
	}

	///////////////////////////////////////////////////////////////////////////////
	//-----------Utils-------------------------------------------------------------
	///////////////////////////////////////////////////////////////////////////////
	
	static WriteLine( s) {
	const msg =  ""+new Date() + ": " +s
		const span = document.createElement( "div" );
		span.textContent = msg;
		form.textBoxOutput.appendChild( span) ;
	}

	///////////////////////////////////////////////////////////////////////////////
	//-----------Main-------------------------------------------------------------
	///////////////////////////////////////////////////////////////////////////////
	
}

//Node.trace=true;
const form = new EbnfForm();
