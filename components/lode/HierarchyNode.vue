<template>
    <li
        :class="['', editingNodeClass]"
        v-cloak
        :id="obj.shortId()">
        <div
            class="lode__hierarchy-item columns is-paddingless is-gapless is-marginless is-mobile is-multiline"
            :class="[{'is-selected-competency-source': isSelectedCompetencySource},{ 'is-selected-competency-target': isInCompetencyTargetsArray}]">
            <!-- begins node itself, starting with check and expand -->
            <div class="column is-12">
                <div class="section is-paddingless">
                    <div class="columns is-paddingless is-gapless is-marginless is-mobile is-multiline">
                        <!-- CONTROLS FOR SELECT -->
                        <div
                            class="check-radio-column column is-narrow is-vcentered">
                            <div
                                v-if="canEdit && view !== 'crosswalk' && view !== 'import'"
                                class="field">
                                <input
                                    class="is-checkradio"
                                    :id="obj.shortId() + 'checkbox'"
                                    type="checkbox"
                                    :name="obj.shortId() + 'checkbox'"
                                    v-model="checked">
                                <label :for="obj.shortId() + 'checkbox'" />
                            </div>
                        </div>
                        <!-- CONTROLS FOR EXPAND -->
                        <div class="expand-column column is-narrow is-vcentered">
                            <div
                                v-if="!collapse && hasChild.length > 0"
                                @click="onExpandEvent()"
                                class="icon is-vcentered">
                                <i class="fa fa-caret-down has-text-primary is-size-2" />
                            </div>
                            <div
                                v-else-if="hasChild.length > 0"
                                @click="onExpandEvent()"
                                class="icon is-vcentered">
                                <i class="fa fa-caret-right has-text-primary is-size-2" />
                            </div>
                            <div
                                v-else
                                class="list-bullet icon is-small is-vcentered is-dark">
                                <i class="fa fa-circle has-text-black" />
                            </div>
                        </div>
                        <!-- end controls for select and expand -->
                        <div class="column full-column constrain-column">
                            <component
                                :is="dynamicThing"
                                :view="view"
                                :id="'scroll-' + obj.shortId().split('/').pop()"
                                :obj="changedObj ? changedObj : obj"
                                @expandEvent="onExpandEvent()"
                                @editNodeEvent="onEditNode()"
                                @doneEditingNodeEvent="onDoneEditingNode()"
                                @addNode="onAddNodeEvent()"
                                :parentNotEditable="!canEdit"
                                :profile="profile"
                                :childrenExpanded="childrenExpanded"
                                :children="this.hasChild.length"
                                :exportOptions="exportOptions"
                                :highlightList="highlightList"
                                class="list-complete-item"
                                :class="newThingClass"
                                :newFramework="newFramework"
                                :index="index"
                                @moveUp="moveUp"
                                @moveDown="moveDown"
                                @moveRight="moveRight"
                                @moveLeft="moveLeft"
                                :frameworkEditable="frameworkEditable"
                                @select="select"
                                @deleteObject="deleteObject"
                                @removeObject="removeObject"
                                @exportObject="exportObject"
                                :editingNode="editingNode"
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
                    </div>
                </div>
            </div>
            <!-- CROSSWALK BUTTONS -->
            <div
                v-if="view === 'crosswalk' && subview === 'crosswalkSource'"
                class="crosswalk-buttons__source">
                <div
                    v-show="sourceState === 'ready'"
                    @click="setCompetencySource"
                    class="button is-outlined is-primary crosswalk-buttons__source__create">
                    <span class="icon">
                        <i class="fa fa-plus" />
                    </span>
                    <span>add</span>
                </div>
                <div
                    v-show="sourceState === 'selectType' && isSelectedCompetencySource"
                    class="field is-grouped has-background-primary">
                    <p class="control">
                        <a
                            @click="removeSourceCompetency"
                            class="button is-text is-small has-text-white">
                            <span class="icon">
                                <i class="fa fa-times" />
                            </span>
                        </a>
                    </p>
                    <p class="control is-expanded">
                        <span class="select is-primary has-text-primary crosswalk-buttons__source__select">
                            <select v-model="alignmentType">
                                <option value>
                                    Select relation
                                </option>
                                <option
                                    v-for="(option, index) in crosswalkOptions"
                                    :key="index"
                                    :value="option.name">
                                    {{ option.name }}
                                </option>
                            </select>
                        </span>
                    </p>
                </div>
                <div
                    class="field is-grouped"
                    v-if="sourceState === 'selectTargets' && isSelectedCompetencySource">
                    <p class="control">
                        <a
                            @click="removeSourceCompetency"
                            class="button is-text is-small has-text-white">
                            <span class="icon">
                                <i class="fa fa-times" />
                            </span>
                        </a>
                    </p>
                    <p class="control is-expanded">
                        <span class="button is-fullwidth is-white crosswalk-buttons__source__type">
                            <span class="icon has-text-primary">
                                <i :class="crosswalkOptions[alignmentType].icon" />
                            </span><span>{{ crosswalkOptions[alignmentType].name }}</span>
                        </span>
                    </p>
                </div>
            </div>
            <div
                v-if="view === 'crosswalk' && subview === 'crosswalkTarget' && sourceState === 'selectTargets'"
                class="crosswalk-buttons__target">
                <div
                    v-show="!isInCompetencyTargetsArray"
                    @click="addToCompetencyTargetsArray(obj.id)"
                    class="button is-fullwidth is-large is-text has-text-primary">
                    <span
                        class="icon">
                        <i class="fa fa-plus" />
                    </span>
                </div>
                <div
                    v-show="isInCompetencyTargetsArray"
                    @click="removeCompetencyFromTargetsArray(obj.id)"
                    class="button is-fullwidth is-large is-text has-text-white">
                    <span
                        class="icon">
                        <i class="fa fa-check" />
                    </span>
                </div>
            </div>
            <!--- end crosswalk buttons -->
            <!-- ADD NODE SECTION below every object should be an option to insert a node -->
            <div
                v-if="view !== 'crosswalk'"
                class="add-node-section">
                <div
                    v-if="!addingNode"
                    class="add-new-node__line"
                    title="Add competency"
                    @click="addingNode = true;">
                    <hr>
                    <div class="button is-small is-outlined is-primary">
                        <span class="icon">
                            <i class="fa fa-plus-circle" />
                        </span>
                        <span> add item </span>
                    </div>
                    <hr>
                </div>
                <div
                    v-else
                    class="add-node__options">
                    <div class="buttons is-centered">
                        <div
                            @click="$store.commit('lode/competencySearchModalOpen', false); addingNode = false;"
                            class="button is-outlined is-small is-dark ">
                            <span class="icon">
                                <i class="fa fa-times" />
                            </span>
                            <span>cancel</span>
                        </div>
                        <div
                            v-if="!hasChild.length"
                            @click="$emit('createNewNodeEvent', parent.shortId(), obj.shortId()); addingNode = false;"
                            class="button is-outlined is-small is-primary ">
                            <span class="icon">
                                <i class="fa fa-plus" />
                            </span>
                            <span>
                                create new
                            </span>
                        </div>
                        <div
                            v-else
                            @click="$emit('createNewNodeEvent', obj.shortId()); addingNode = false;"
                            class="button is-outlined is-small is-primary ">
                            <span class="icon">
                                <i class="fa fa-plus" />
                            </span>
                            <span>
                                create new
                            </span>
                        </div>
                        <div
                            v-if="obj && obj.type !== 'Concept'"
                            @click="clickToSearch"
                            class="button is-outlined is-small is-primary ">
                            <span class="icon">
                                <i class="fa fa-search" />
                            </span>
                            <span>search competencies</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <template
            v-if="!collapse">
            <draggable
                :id="obj.shortId()"
                v-bind="dragOptions"
                v-model="hasChild"
                :group="{ name: 'test' }"
                handle=".handle"
                tag="ul"
                :class="(dragging == true ? ' dragging' : '')"
                class="lode__hierarchy-sub-ul"
                :disabled="canEdit != true || !isDraggable"
                @start="beginDrag"
                @end="endDrag">
                <!--<transition-group
                    type="transition"
                    :name="!dragging ? 'flip-list' : null">-->
                <HierarchyNode
                    :view="view"
                    :subview="subview"
                    v-for="(item, i) in hasChild"
                    @createNewNodeEvent="onCreateNewNode"
                    :key="item.obj.id"
                    class="lode__hierarchy-sub-li"
                    :obj="item.obj"
                    :hasChild="item.children"
                    :dragging="dragging"
                    :canEdit="canEdit"
                    :profile="profile"
                    :exportOptions="exportOptions"
                    :highlightList="highlightList"
                    :selectAll="selectAll"
                    :newFramework="newFramework"
                    :index="i"
                    :parentStructure="hasChild"
                    :parent="obj"
                    :frameworkEditable="frameworkEditable"
                    @beginDrag="beginDrag"
                    @move="move"
                    @select="select"
                    @add="add"
                    @deleteObject="deleteObject"
                    @removeObject="removeObject"
                    @exportObject="exportObject"
                    :properties="properties"
                    :parentChecked="checked">
                    <template v-slot:copyURL="slotProps">
                        <slot
                            name="copyURL"
                            :expandedProperty="slotProps.expandedProperty"
                            :expandedValue="slotProps.expandedValue" />
                    </template>
                    <slot />
                    <!--
                       <i
                            v-if="canEdit"
                            class="drag-footer fa fa-plus"
                            slot="footer"
                            @click="add(obj.shortId(), item.obj)" /> -->
                </HierarchyNode>
                <!--</transition-group>-->
            </draggable>
        </template>
    </li>
</template>
<script>
import {mapState} from 'vuex';

export default {
    name: "HierarchyNode",
    props: {
        obj: Object,
        filter: String,
        hasChild: Array,
        canEdit: Boolean,
        dragging: Boolean,
        profile: Object,
        exportOptions: Array,
        highlightList: Array,
        selectAll: Boolean,
        newFramework: Boolean,
        index: Number,
        parentStructure: Array,
        parent: Object,
        frameworkEditable: Boolean,
        properties: String,
        expandAll: Boolean,
        parentChecked: Boolean,
        view: {
            type: String,
            default: 'framework'
        },
        subview: {
            type: String,
            default: ''
        }
    },
    components: {
        ThingEditing: () => import('./ThingEditing.vue'),
        Thing: () => import('./Thing.vue'),
        draggable: () => import('vuedraggable')
    },
    data: function() {
        return {
            crosswalkOptions: {
                narrows: {
                    name: 'narrows',
                    icon: 'fa fa-less-than'
                },
                broadens: {
                    name: 'broadens',
                    icon: 'fa fa-greater-than'
                },
                equals: {
                    name: 'equals',
                    icon: 'fa fa-equals'
                },
                enables: {
                    name: 'enables',
                    icon: 'fa fa-toggle-off'
                },
                similar: {
                    name: 'similar',
                    icon: 'fas fa-tilde'
                },
                enabledBy: {
                    name: 'enables',
                    icon: 'fa fa-toggle-on'
                },
                desires: {
                    name: 'desires',
                    icon: 'fa fa-crosshairs'
                },
                requires: {
                    name: 'requires',
                    icon: 'fa fa-asterisk'
                },
                related: {
                    name: 'related',
                    icon: 'fa fa-sync'
                }
            },
            dragOptions: {
                delay: 100,
                easing: "cubic-bezier(1, 1, 0.55, 1)",
                animation: 150,
                disabled: false,
                ghostClass: 'ghost-drag',
                chosenClass: 'chosen-drag',
                dragClass: 'drag',
                scrollSensitivity: 200,
                forceFallback: true
            },
            isDraggable: true,
            clickToDragIconClass: 'is-primary-down fa-arrows-alt',
            addingNode: false,
            editingNode: false,
            collapse: false,
            controlOnStart: false,
            checked: false,
            childrenExpanded: true,
            // Needed to update the obj prop passed to the dynamic Thing/ThingEditing component on change to the object
            changedObj: null
        };
    },
    computed: {
        ...mapState({
            competencySource: state => state.crosswalk.tempAlignment.source,
            competencyTargets: state => state.crosswalk.tempAlignment.targets,
            targetState: state => state.crosswalk.targetState,
            sourceState: state => state.crosswalk.sourceState
        }),
        alignmentType: {
            get: function() {
                return this.$store.getters['crosswalk/alignmentType'];
            },
            set: function(value) {
                console.log("value: ", value);
                this.$store.commit('crosswalk/alignmentType', value);
            }
        },
        isSelectedCompetencySource: function() {
            if (this.competencySource === this.obj.id && this.subview === 'crosswalkSource') {
                return true;
            } else {
                return false;
            }
        },
        isInCompetencyTargetsArray: function() {
            if (!this.competencyTargets) {
                return false;
            }
            if (this.subview === 'crosswalkTarget' && this.competencyTargets.includes(this.obj.id)) {
                return true;
            } else {
                return false;
            }
        },
        /*
         * Dynamic thing is a computed value that <component>
         * observes in order to decide which thing structure to load
         * if editingNode is set to true
         * we should load the ThingEditing vue template
         * otherwise viewing,  we can add to this later
         */
        dynamicThing: function() {
            if (this.editingNode || this.newThingClass === 'new-thing') {
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
        },
        editingNodeClass: function() {
            if (this.editingNode) {
                return 'editing-thing';
            } else {
                return '';
            }
        }
    },
    // used to help the parent know when nodes stop rendering
    mounted() {
        this.$emit('mountingNode');
        console.log("hierarchyNode.vue is mounted");
    },
    methods: {
        removeSourceCompetency: function() {
            this.$store.commit('crosswalk/competencySource', null);
            this.$store.commit('crosswalk/sourceState', 'ready');
            this.$store.commit('crosswalk/alignmentType', '');
            this.$store.commit('crosswalk/competencyTargets', []);
        },
        removeCompetencyFromTargetsArray: function(id) {
            this.$store.commit('crosswalk/removeFromTargetsArray', id);
        },
        addToCompetencyTargetsArray: function(id) {
            this.$store.commit('crosswalk/addCompetencyTarget', id);
        },
        setCompetencySource: function() {
            this.$store.commit('crosswalk/competencySource', this.obj.id);
            this.$store.commit('crosswalk/sourceState', 'selectType');
        },
        setRelationType: function(e) {
            console.log("event is: ",);
            this.$store.commit('crosswalk/alignmentType', e.target.value);
            this.$store.commit('crosswalk/sourceState', 'selectTargets');
        },
        handleCrossWalkNodeClick: function(type) {
            if (this.subview === 'crosswalkSource') {
                this.setCrosswalkSourceCompetency(type);
            } else if (this.subview === 'crosswalkTarget') {
                this.addCrosswalkTargetComeptency();
            } else {
                console.log("Error: no subview for crosswalk");
            }
        },
        setCrosswalkSourceCompetency: function(type) {
            this.$store.commit('crosswalk/competencySource', this.obj.id);
            this.$store.commit('crosswalk/alignmentType', type);
        },
        addCrosswalkTargetComeptency: function() {
            this.$store.commit('crosswalk/competencyTarget', this.obj.id);
        },
        onEditNode: function() {
            this.editingNode = true;
        },
        onDoneEditingNode: function() {
            this.editingNode = false;
            if (this.$store.state.editor) {
                this.$store.commit('editor/newCompetency', null);
            }
            // Update the obj prop passed to Thing/ThingEditing so edits are reflected
            this.changedObj = EcRepository.getBlocking(this.obj.shortId());
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
            var toContainerId = this.$parent.$parent.parent.shortId();
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
        },
        clickToSearch: function() {
            this.$store.commit('lode/competencySearchModalOpen', true);
            this.$store.commit('app/showModal', {component: 'Search'});
            this.$store.commit('lode/searchType', "Competency");
            this.$store.commit('lode/copyOrLink', true);
            if (this.$store.state.editor) {
                this.$store.commit('editor/selectedCompetency', this.obj);
            }
        }
    },
    watch: {
        alignmentType: function(val) {
            if (val !== '') {
                this.$store.commit('crosswalk/sourceState', 'selectTargets');
                this.$store.commit('crosswalk/targetState', 'ready');
            }
        },
        checked: function() {
            // Select event propagates up multiple components.
            this.$emit('select', this.obj.id, this.checked);
        },
        selectAll: function() {
            this.checked = this.selectAll;
        },
        expandAll: function() {
            if (this.expandAll === true) {
                if (this.hasChild.length > 0) {
                    this.collapse = false;
                }
                this.childrenExpanded = true;
            } else {
                // Otherwise collapse all
                if (this.hasChild.length > 0) {
                    this.collapse = true;
                }
                this.childrenExpanded = false;
            }
        },
        parentChecked: function() {
            this.checked = this.parentChecked;
        }
    }
};
</script>

<style lang="scss">
    @import './../../../scss/variables.scss';

</style>