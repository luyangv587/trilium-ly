import TabAwareWidget from "./tab_aware_widget.js";
import AttributeDetailWidget from "./attribute_detail.js";
import attributeRenderer from "../services/attribute_renderer.js";
import AttributeEditorWidget from "./attribute_editor.js";

const TPL = `
<div class="attribute-list">
<style>
    .attribute-list {
        margin-left: 7px;
        margin-right: 7px;
    }
    
    .inherited-attributes {
        color: var(--muted-text-color);
        max-height: 200px;
        overflow: auto;
        padding-bottom: 5px;
        padding-left: 7px;
    }
    
    .attribute-list-editor p {
        margin: 0 !important;
    }
    
    .attribute-list.error .attribute-list-editor {
        border-color: red !important;
    }
    
    .attr-expander {
        display: flex; 
        flex-direction: row; 
        color: var(--muted-text-color); 
        font-size: small;
    }
    
    .attribute-list hr {
        height: 1px;
        border-color: var(--main-border-color);
        position: relative;
        top: 4px;
        margin-top: 5px;
        margin-bottom: 0;
    }
    
    .attr-expander-text {
        padding-left: 20px;
        padding-right: 20px;
        white-space: nowrap;
    }
    
    .attr-expander:hover {
        cursor: pointer;
    }
    
    .attr-expander:not(.error):hover hr {
        border-color: black;
    }
    
    .attr-expander:not(.error):hover .attr-expander-text {
        color: black;
    }
</style>

<div class="attr-expander attr-owned-expander">
    <hr class="w-100">
    
    <div class="attr-expander-text"></div>
    
    <hr class="w-100">
</div>

<div class="attr-display">
    <div class="attr-editor-placeholder"></div>
    
    <hr class="w-100 attr-inherited-empty-expander" style="margin-bottom: 10px;">
    
    <div class="attr-expander attr-inherited-expander">
        <hr class="w-100">
        
        <div class="attr-expander-text"></div>
        
        <hr class="w-100">
    </div>
    
    <div class="inherited-attributes"></div>
</div>

</div>
`;

export default class AttributeListWidget extends TabAwareWidget {
    constructor() {
        super();

        this.attributeEditorWidget = new AttributeEditorWidget().setParent(this);
        this.attributeDetailWidget = new AttributeDetailWidget().setParent(this);

        this.child(this.attributeEditorWidget, this.attributeDetailWidget);
    }

    doRender() {
        this.$widget = $(TPL);

        this.$attrDisplay = this.$widget.find('.attr-display');

        this.$ownedExpander = this.$widget.find('.attr-owned-expander');
        this.$ownedExpander.on('click', () => {
            if (this.$attrDisplay.is(":visible")) {
                this.$attrDisplay.slideUp(200);
            }
            else {
                this.$attrDisplay.slideDown(200);
            }
        });

        this.$ownedExpanderText = this.$ownedExpander.find('.attr-expander-text');

        this.$inheritedAttributes = this.$widget.find('.inherited-attributes');

        this.$inheritedExpander = this.$widget.find('.attr-inherited-expander');
        this.$inheritedExpander.on('click', () => {
            if (this.$inheritedAttributes.is(":visible")) {
                this.$inheritedAttributes.slideUp(200);
            }
            else {
                this.$inheritedAttributes.slideDown(200);
            }
        });

        this.$inheritedExpanderText = this.$inheritedExpander.find('.attr-expander-text');

        this.$inheritedEmptyExpander = this.$widget.find('.attr-inherited-empty-expander');

        this.$widget.find('.attr-editor-placeholder').replaceWith(this.attributeEditorWidget.render());
        this.$widget.append(this.attributeDetailWidget.render());
    }

    async refreshWithNote(note) {
        const ownedAttributes = note.getOwnedAttributes();

        this.$ownedExpanderText.text(ownedAttributes.length + ' owned ' + this.attrPlural(ownedAttributes.length));

        const inheritedAttributes = note.getAttributes().filter(attr => attr.noteId !== this.noteId);

        if (inheritedAttributes.length === 0) {
            this.$inheritedExpander.hide();
            this.$inheritedEmptyExpander.show();
        }
        else {
            this.$inheritedExpander.show();
            this.$inheritedEmptyExpander.hide();
        }

        this.$inheritedExpanderText.text(inheritedAttributes.length + ' inherited ' + this.attrPlural(inheritedAttributes.length));

        this.$inheritedAttributes.empty();

        await this.renderInheritedAttributes(inheritedAttributes, this.$inheritedAttributes);
    }

    attrPlural(number) {
        return 'attribute' + (number === 1 ? '' : 's');
    }

    renderInheritedAttributes(attributes, $container) {
        for (const attribute of attributes) {
            const $span = $("<span>")
                .on('click', e => this.attributeDetailWidget.showAttributeDetail({
                    attribute: {
                        noteId: attribute.noteId,
                        type: attribute.type,
                        name: attribute.name,
                        value: attribute.value
                    },
                    isOwned: false,
                    x: e.pageX,
                    y: e.pageY
                }));

            $container.append($span);

            attributeRenderer.renderAttribute(attribute, $span, false);
        }
    }
}