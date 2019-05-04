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
    outputarea,
    completer,
    celltoolbar,
    CodeMirror
    ) {
    "use strict";
    
    var CodeCell = cell.CodeCell;
    var MarkdownCell = cell.MarkdownCell;

    var LiterateCell = function (kernel, options) {
        /**
         * Constructor
         *
         * A Cell conceived to write literate code.
         *
         */

        CodeCell.apply(this, kernel, options);
        MarkdownCell.apply(this, options);

        // Attributes we want to override in this subclass.
        this.cell_type = "literate";
        this.class_config = new configmod.ConfigWithDefaults(options.config, CodeCell.options_default, 'CodeCell');
        var that = this;
    };

    LiterateCell.prototype = Object.create(CodeCell.prototype);
    LiterateCell.markdownprototype = Object.create(MarkdownCell.prototype);
    
    /**
     * Create the DOM element of the LiterateCell
     * @method create_element
     * @private
     */
    LiterateCell.prototype.create_element = function () {
        Cell.prototype.create_element.apply(this, arguments);
        var that = this;

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

        // NEW
        var render_area = $('<div/>').addClass('text_cell_render rendered_html')
            .attr('tabindex','-1');
        inner_cell.append(input_area).append(render_area); 

        prompt_container.append(prompt).append(run_this_cell);
        input.append(prompt_container).append(inner_cell);

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
    };

    /**
     * Execute current code cell to the kernel
     * @method execute
     */
    LiterateCell.prototype.execute = function (stop_on_error) {
        CodeCell.prototype.execute.apply(this, arguments);
        LiterateCell.markdownprototype.execute.apply(this, arguments);
    };

    return {'LiterateCell' : LiterateCell};
});
