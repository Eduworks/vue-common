<template>
    <li
        :class="['e-HierarchyNode', editingThingClass]"
        v-cloak
        :id="obj.shortId()">
        <div
            class="columns is-paddingless is-gapless is-marginless is-mobile is-multiline">
            <!-- beings node itself, starting with check and expand -->
            <div class="column is-12">
                <div class="section is-paddingless">
                    <div class="columns is-mobile is-multiline">
                        <!-- controls for select and expand -->
                        <div class="column is-narrow is-vcentered">
                            <div class="icon is-vcentered">
                                <input
                                    v-if="true"
                                    type="checkbox"
                                    v-model="checked">
                            </div>
                            <div
                                v-if="!collapse && hasChild.length > 0"
                                @click="onExpandEvent()"
                                class="icon is-vcentered">
                                <i class="fa fa-caret-down has-text-light is-size-3" />
                            </div>
                            <div
                                v-else-if="hasChild.length > 0"
                                @click="onExpandEvent()"
                                class="icon is-vcentered">
                                <i class="fa fa-caret-right has-text-light is-size-3" />
                            </div>
                            <div
                                v-else
                                class="icon is-vcentered">
                                <i class="fa fa-circle is-size-7 has-text-light" />
                            </div>
                        </div>
                        <!-- end controls for select and expand -->
                        <div class="column full-column has-background-white constrain-column">
                            <component
                                :is="dynamicThing"
                                :obj="obj"
                                @expandEvent="onExpandEvent()"
                                @editNodeEvent="onEditNode()"
                                @editingThing="handleEditingThing($event)"
                                @addNode="onAddNodeEvent()"
                                :parentNotEditable="!canEdit"
                                :profile="profile"
                                :childrenExpanded="childrenExpanded"
                                :children="this.hasChild.length"
                                :exportOptions="exportOptions"
                                :highlightList="highlightList"
                                :iframePath="iframePath"
                                :iframeText="iframeText"
                                class="list-complete-item"
                                :class="newThingClass"
                                :newFramework="newFramework"
                                :index="index"
                                @moveUp="moveUp"
                                @moveDown="moveDown"
                                @moveRight="moveRight"
                                @moveLeft="moveLeft"
                                :containerEditable="isEditingNode"
                                @select="select"
                                @deleteObject="deleteObject"
                                @removeObject="removeObject"
                                @exportObject="exportObject"
                                :isEditingContainer="isEditingContainer"
                                :isEditingNode="isEditingNode"
                                :cantMoveUp="cantMoveUp"
                                :cantMoveDown="cantMoveDown"
                                :cantMoveRight="cantMoveRight"
                                :cantMoveLeft="cantMoveLeft"
                                :properties="properties">
                                <template v-slot:copyURL="slotProps">
                                    <slot
                                        name="copyURL"
                                        :expandedProperty="slotProps.expandedProperty"
                                        :expandedValue="slotProps.expandedValue" />
                                </template>
                                <slot />
                            </component>
                        </div>
                        <div
                            v-if="!collapse && hasChild.length > 0"
                            class="column is-12 nested-competency">
                            <div
                                :class="(dragging == true ? ' dragging' : '')">
                                <draggable
                                    :id="obj.shortId()"
                                    v-model="hasChild"
                                    :group="{ name: 'test' }"
                                    :disabled="canEdit != true"
                                    @start="beginDrag"
                                    @end="endDrag">
                                    <transition-group
                                        name="list-complete"
                                        tag="ul"
                                        class="e-HierarchyNode-ul">
                                        <HierarchyNode
                                            v-for="(item, i) in hasChild"
                                            @showCompetencySearchModalEvent="$emit('showCompetencySearchModalEvent')"
                                            @createNewNodeEvent="onCreateNewNode"
                                            :key="item.obj.id"
                                            class="list-complete-item"
                                            :obj="item.obj"
                                            :hasChild="item.children"
                                            :dragging="dragging"
                                            :canEdit="canEdit"
                                            :profile="profile"
                                            :exportOptions="exportOptions"
                                            :highlightList="highlightList"
                                            :selectMode="selectMode"
                                            :selectAll="selectAll"
                                            :iframePath="iframePath"
                                            :iframeText="iframeText"
                                            :newFramework="newFramework"
                                            :index="i"
                                            :parentStructure="hasChild"
                                            :parent="obj"
                                            :containerEditable="containerEditable"
                                            @beginDrag="beginDrag"
                                            @move="move"
                                            @select="select"
                                            @add="add"
                                            @deleteObject="deleteObject"
                                            @removeObject="removeObject"
                                            @exportObject="exportObject"
                                            :isEditingContainer="isEditingContainer"
                                            @editingThing="handleEditingContainer($event)"
                                            :properties="properties">
                                            <template v-slot:copyURL="slotProps">
                                                <slot
                                                    name="copyURL"
                                                    :expandedProperty="slotProps.expandedProperty"
                                                    :expandedValue="slotProps.expandedValue" />
                                            </template>
                                            <slot />
                                        </HierarchyNode>
                                    </transition-group>
                                    <!--<i
                                        v-if="canEdit"
                                        class="drag-footer fa fa-plus"
                                        slot="footer"
                                        @click="add(obj.shortId())" />-->
                                </draggable>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- above every node should be an option to insert a node -->
            <div
                id="add-node-section"
                class="column is-12 is-vcentered">
                <div
                    v-if="!addingNode"
                    class="add-new-node">
                    <i
                        @click="addingNode = true;"
                        class="fa fa-plus-circle has-text-light is-pulled-left is-size-3" />
                    <hr class="add-new-node__line">
                </div>
                <div
                    v-else
                    class="add-node__options">
                    <div class="buttons is-centered">
                        <div
                            @click="$emit('createNewNodeEvent', parent.shortId(), obj.shortId()); addingNode = false;"
                            class="button">
                            create new
                        </div>
                        <div
                            @click="$emit('showCompetencySearchModalEvent')"
                            class="button">
                            search competencies
                        </div>
                        <div
                            @click="$emit('closeCompetencySearchModalEvent'); addingNode = false;"
                            class="button">
                            cancel
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </li>
</template>
<script>
import Thing from './Thing.vue';
import ThingEditing from './ThingEditing.vue';
import draggable from 'vuedraggable';

export default {
    name: "HierarchyNode",
    props: {
        obj: Object,
        hasChild: Array,
        canEdit: Boolean,
        dragging: Boolean,
        profile: Object,
        exportOptions: Array,
        highlightList: Array,
        selectMode: Boolean,
        selectAll: Boolean,
        iframePath: String,
        iframeText: String,
        newFramework: Boolean,
        index: Number,
        parentStructure: Array,
        parent: Object,
        containerEditable: Boolean,
        isEditingContainer: Boolean,
        properties: String
    },
    components: {ThingEditing, Thing, draggable},
    data: function() {
        return {
            showCompetencySearchModal: false,
            addingNode: false,
            isEditingNode: false,
            collapse: false,
            controlOnStart: false,
            checked: false,
            editingThingClass: '',
            childrenExpanded: true
        };
    },
    computed: {
        /*
         * Dynamic thing is a computed value that <component>
         * observes in order to decide which thing structure to load
         * if isEditingContainer is set to true
         * we should load the ThingEditing vue template
         * otherwise viewing,  we can add to this later
         */
        dynamicThing: function() {
            if (this.isEditingNode) {
                return 'ThingEditing';
            } else {
                return 'Thing';
            }
        },
        newThingClass: function() {
            if (this.$store.state.editor) {
                if (this.obj.shortId() === this.$store.state.editor.newCompetency) {
                    return 'new-thing';
                }
            }
            return '';
        },
        cantMoveUp: function() {
            if (this.index - 1 < 0) {
                return true;
            }
            return false;
        },
        cantMoveDown: function() {
            if (this.index + 1 >= this.parentStructure.length) {
                return true;
            }
            return false;
        },
        cantMoveRight: function() {
            if (this.index - 1 < 0) {
                return true;
            }
            return false;
        },
        cantMoveLeft: function() {
            if (this.parent.type === "Framework") {
                return true;
            }
            return false;
        }
    },
    // used to help the parent know when nodes stop rendering
    mounted() {
        this.$emit('mountingNode');
    },
    methods: {
        onEditNode: function() {
            this.isEditingNode = true;
        },
        handleEditingThing: function(e) {
            if (e) {
                this.editingThingClass = 'editing-thing';
                this.$emit('editingThing', true);
            } else {
                this.editingThingClass = '';
                this.$emit('editingThing', false);
            }
        },
        handleEditingContainer: function(e) {
            if (e) {
                this.$emit('editingThing', true);
            } else {
                this.$emit('editingThing', false);
            }
        },
        onAddNodeEvent: function() {
            this.add(this.obj.shortId());
        },
        onExpandEvent: function() {
            this.collapseIfPossible();
            this.childrenExpanded = !this.childrenExpanded;
        },
        collapseIfPossible: function() {
            if (this.hasChild.length > 0) {
                this.collapse = !this.collapse;
            }
        },
        // WARNING: The Daemon of OBO lingers in these here drag and move methods. The library moves the objects, and OBO will then come get you!
        beginDrag: function(event) {
            if (event !== undefined) {
                this.controlOnStart = event.originalEvent.ctrlKey || event.originalEvent.shiftKey;
            }
            this.$emit('beginDrag');
        },
        endDrag: function(foo) {
            console.log(foo.oldIndex, foo.newIndex);
            var toId = null;
            var plusup = 0;
            if (foo.from.id === foo.to.id) {
                if (foo.newIndex + 1 < this.hasChild.length) {
                    toId = this.hasChild[foo.newIndex + 1].obj.shortId();
                }
            } else {
                if (foo.to.children[foo.newIndex] === undefined) {
                    toId = foo.to.id;
                } else {
                    if (foo.to.id === "") {
                        if (foo.newIndex < foo.to.children.length) {
                            toId = foo.to.children[foo.newIndex].id;
                        }
                    } else {
                        if (foo.newIndex + 1 < foo.to.children.length) {
                            toId = foo.to.children[foo.newIndex + 1].id;
                        }
                    }
                }
            }
            this.move(
                foo.clone.id,
                toId,
                foo.from.id,
                foo.to.id,
                !this.controlOnStart, plusup);
        },
        move: function(fromId, toId, fromContainerId, toContainerId, removeOldRelations, plusup) {
            this.$emit('move', fromId, toId, fromContainerId, toContainerId, removeOldRelations, plusup);
        },
        moveUp: function(thingId, index) {
            if (this.cantMoveUp) {
                return;
            }
            var fromId = thingId;
            var parent = this.parent.shortId();
            var toId = this.parentStructure[index - 1].obj.shortId();
            this.move(fromId, toId, parent, parent, true, 0);
        },
        moveDown: function(thingId, index) {
            if (this.cantMoveDown) {
                return;
            }
            var toId = null;
            var fromId = thingId;
            var parent = this.parent.shortId();
            if (index + 2 !== this.parentStructure.length) {
                var toId = this.parentStructure[index + 2].obj.shortId();
            }
            this.move(fromId, toId, parent, parent, true, 0);
        },
        moveRight: function(thingId, index) {
            if (this.cantMoveRight) {
                return;
            }
            var fromId = thingId;
            var toId = null;
            var fromContainerId = this.parent.shortId();
            var toContainerId = this.parentStructure[index - 1].obj.shortId();
            this.move(fromId, toId, fromContainerId, toContainerId, true, 0);
        },
        moveLeft: function(thingId, index) {
            if (this.cantMoveLeft) {
                return;
            }
            var fromId = thingId;
            var fromContainerId = this.parent.shortId();
            var toId = null;
            var toContainerId = this.$parent.$parent.$parent.parent.shortId();
            this.move(fromId, toId, fromContainerId, toContainerId, true, 0);
        },
        add: function(containerId) {
            this.$emit('add', containerId);
        },
        select: function(objId, checked) {
            this.$emit('select', objId, checked);
        },
        deleteObject: function(thing) {
            this.$emit('deleteObject', thing);
        },
        removeObject: function(thing) {
            this.$emit('removeObject', thing);
        },
        exportObject: function(thing, type) {
            this.$emit('exportObject', thing, type);
        },
        onCreateNewNode: function(parentId, previousSiblingId) {
            this.$emit('createNewNodeEvent', parentId, previousSiblingId);
        }
    },
    watch: {
        checked: function() {
            this.$emit('select', this.obj.id, this.checked);
        },
        selectAll: function() {
            if (this.selectMode) {
                this.checked = this.selectAll;
            }
        }
    }
};
</script>

<style>
</style>