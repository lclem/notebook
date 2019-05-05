// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 *
 *
 * @module literatecell
 * @namespace literatecell
 * @class LiterateCell
 */

define([
    'jquery',
    'base/js/namespace',
    'base/js/utils',
    'base/js/i18n',
    'base/js/keyboard',
    'services/config',
    'notebook/js/cell',
    'notebook/js/textcell',
    'notebook/js/codecell',
    'notebook/js/outputarea',
    'notebook/js/completer',
    'notebook/js/celltoolbar',
    'codemirror/lib/codemirror',
    'codemirror/mode/python/python',
    'notebook/js/codemirror-ipython'
], function(
    $,
    IPython,
    utils,
    i18n,
    keyboard,
    configmod,
    cell,
    textcell,
    codecell,
    outputarea,
    completer,
    celltoolbar,
    CodeMirror,
    cmpython,
    cmip
    ) {
    "use strict";
    
    var Cell = cell.Cell;
    var CodeCell = codecell.CodeCell;
    var MarkdownCell = textcell.MarkdownCell;

    var LiterateCell = function (kernel, options) {

        this.config = options.config;
        this.class_config = new configmod.ConfigWithDefaults(this.config, LiterateCell.options_default, 'LiterateCell');

        CodeCell.call(this, kernel, options);
        MarkdownCell.call(this, options);

        // Attributes we want to override in this subclass.
        this.cell_type = 'literate';
        this.rendered = false;
        var that = this;

    };

    LiterateCell.options_default = {
        cm_config : {
            extraKeys: {
                "Backspace" : "delSpaceToPrevTabStop",
            },
            mode: 'ipythongfm', //'htmlmixed',
//            theme: 'ipython',
            matchBrackets: true,
            autoCloseBrackets: true,
            lineWrapping : true,
            lineNumbers : true
        },
        highlight_modes : {
            'magic_javascript'    :{'reg':['^%%javascript']},
            'magic_perl'          :{'reg':['^%%perl']},
            'magic_ruby'          :{'reg':['^%%ruby']},
            'magic_python'        :{'reg':['^%%python3?']},
            'magic_shell'         :{'reg':['^%%bash']},
            'magic_r'             :{'reg':['^%%R']},
            'magic_text/x-cython' :{'reg':['^%%cython']},
        },
    };

    CodeCell.msg_cells = {};

    LiterateCell.prototype = Object.create(CodeCell.prototype);

    LiterateCell.prototype.fromJSON = CodeCell.prototype.fromJSON;
    LiterateCell.prototype.toJSON = CodeCell.prototype.toJSON;

    LiterateCell.prototype.set_rendered = MarkdownCell.prototype.set_rendered;
    LiterateCell.prototype.unrender = MarkdownCell.prototype.unrender;
    LiterateCell.prototype.add_attachment = MarkdownCell.prototype.add_attachment
    LiterateCell.prototype.select = MarkdownCell.prototype.select;
    LiterateCell.prototype.set_text = MarkdownCell.prototype.set_text;
    LiterateCell.prototype.get_rendered = MarkdownCell.prototype.get_rendered;
    LiterateCell.prototype.set_heading_level = MarkdownCell.prototype.set_heading_level;
    LiterateCell.prototype.insert_inline_image_from_blob = MarkdownCell.prototype.insert_inline_image_from_blob;
    LiterateCell.prototype.bind_events = MarkdownCell.prototype.bind_events;

    LiterateCell.prototype.create_element = function () {

        CodeCell.prototype.create_element_core.call(this, 'literate_cell', LiterateCell.options_default.cm_config);

        /*
        var cell =  $('<div></div>').addClass('cell literate_cell');
        cell.attr('tabindex','2');

        var input = $('<div></div>').addClass('input');
        this.input = input;

        var prompt_container = $('<div/>').addClass('prompt_container');

        var run_this_cell = $('<div></div>').addClass('run_this_cell');
        run_this_cell.prop('title', 'Run this cell');
        run_this_cell.append('<i class="fa-step-forward fa"></i>');
        run_this_cell.click(function (event) {
            event.stopImmediatePropagation();
            that.execute();
        });

        var prompt = $('<div/>').addClass('prompt input_prompt');
        
        var inner_cell = $('<div/>').addClass('inner_cell');
        this.celltoolbar = new celltoolbar.CellToolbar({
            cell: this, 
            notebook: this.notebook});
        inner_cell.append(this.celltoolbar.element);
        var input_area = $('<div/>').addClass('input_area');
        this.input_area = input_area;
        
        this.code_mirror = new CodeMirror(input_area.get(0), this._options.cm_config);
        // In case of bugs that put the keyboard manager into an inconsistent state,
        // ensure KM is enabled when CodeMirror is focused:
        this.code_mirror.on('focus', function () {
            if (that.keyboard_manager) {
                that.keyboard_manager.enable();
            }

            that.code_mirror.setOption('readOnly', !that.is_editable());
        });
        this.code_mirror.on('keydown', $.proxy(this.handle_keyevent,this));
        $(this.code_mirror.getInputField()).attr("spellcheck", "false");

        inner_cell.append(input_area);
        this.inner_cell = inner_cell;
        prompt_container.append(prompt).append(run_this_cell);

//        if(cell_type === 'code_cell')
//            input.append(prompt_container);
        
        input.append(inner_cell);

        var output = $('<div></div>');
        cell.append(input).append(output);
        this.element = cell;
        this.output_area = new outputarea.OutputArea({
            config: this.config,
            selector: output,
            prompt_area: true,
            events: this.events,
            keyboard_manager: this.keyboard_manager,
        });
        this.completer = new completer.Completer(this, this.events);
        */

        var render_area = $('<div/>').addClass('text_cell_render rendered_html').attr('tabindex','-1');
        this.inner_cell.append(render_area); 

    };

    LiterateCell.prototype.execute = function (stop_on_error) {

        var text = this.get_text();
        console.log("Current text: " + text);

        // extract blocks of code between executable code chunks markers "````"
        var blocks = text.split('````');

        // we are interested in odd blocks        
        var code = "";
        for (var i = 1; i < blocks.length; i += 2) {
            code += blocks[i];
        }

        console.log("Extracted executable code chunks: \n" + code);

        CodeCell.prototype.execute_core.call(this, stop_on_error, code);
        LiterateCell.prototype.render.call(this);

    };

    LiterateCell.prototype.render = function () {

        console.log("LiterateCell.prototype.render")

        var text = this.get_text();
        var blocks = text.split('````');
        var code = "";

        if (blocks.length > 0 && this.kernel) {

            var kernel = this.kernel.name;
            console.log("Current kernel: " + kernel);
    
            for (var i = 0; i < blocks.length; i++) {
                code += blocks[i];
                i++;
                if (i < blocks.length) {
                    code += '```' + kernel; // instruct codemirror to render the code with the current kernel name
                    code += blocks[i];
                    code += '```';
                }
            }
        }
        else
            code = text

        console.log("Extracted executable code chunks: \n" + code);

        var cont = CodeCell.prototype.render.apply(this, arguments);
        cont = MarkdownCell.prototype.render_core.call(this, code);
        return cont;
        
    };

    return {'LiterateCell' : LiterateCell};

});

