<!--
Property.vue is utilized by Thing.vue
Cycling through a list of properties to be displayed
either displays their input ThingEditing.vue
or their display values Thing.vue
TO DO MAYBE: Separate out property by editing or not.
-->
<template>
    <div
        v-if="expandedThing"
        :class="['lode__Property lode__' + shortTypeAsClass, editingPropertyClass,
                 { 'has-value': expandedValue}
        ]">
        <!-- begin values -->
        <template
            v-if="expandedValue && show">
            <div
                v-for="(item,index) in expandedValue"
                :key="index"
                class="property-section">
                <template v-if="editingProperty">
                    <h4
                        v-if="index === 0"
                        class="property-header is-size-5"
                        :title="comment">
                        {{ displayLabel }}
                        <i
                            v-if="comment"
                            :title="comment"
                            class="fa fa-info-circle has-text-dark"
                            aria-hidden="true" />
                    </h4>
                </template>
                <!-- properties that are relations, levels, and click to load -->
                <template
                    v-if="!editingProperty && isLink(item) && expandedProperty != '@id' && expandedProperty != 'registryURL'">
                    <Component
                        :is="dynamicThing"
                        :uri="item['@id'] || item['@value']"
                        :clickToLoad="true"
                        class="lode__property"
                        :competencyAsPropertyType="shortType"
                        :competencyAsPropertyObjectType="objectType"
                        :parentNotEditable="!canEdit"
                        :profile="childProfile"
                        @deleteObject="deleteObject" />
                    <div
                        class="editing-property"
                        v-if="editingProperty">
                        <div class="control ">
                            <label><br></label>
                            <div
                                @click="showModal('remove', item)"
                                class="button is-text has-text-danger">
                                <i class="fa fa-times" />
                            </div>
                        </div>
                    </div>
                </template>
                <!-- non text field -->
                <div
                    v-else-if="!isText(item)"
                    class="non-text-field">
                    <Component
                        :is="dynamicThing"
                        :expandedObj="item"
                        :competencyAsPropertyType="shortType"
                        :competencyAsPropertyObjectType="objectType"
                        :parentNotEditable="!canEdit"
                        :profile="childProfile"
                        @deleteObject="deleteObject" />
                    <div class="field delete-property-button">
                        <div class="control">
                            <label><br></label>
                            <div
                                @click="showModal('remove', item)"
                                class="button is-outlined has-text-danger">
                                <i class="fa fa-times" />
                            </div>
                        </div>
                    </div>
                </div>
                <!-- read only link properties -->
                <div
                    class="read-only__link"
                    v-else-if="profile && profile[expandedProperty] && isLink(item) && (profile[expandedProperty]['noTextEditing'] === 'true' || profile[expandedProperty]['readOnly'] === 'true'
                        || profile[expandedProperty]['noTextEditing'] === true || profile[expandedProperty]['readOnly'] === true)">
                    <div class="field has-addons">
                        <p class="control">
                            <span
                                class="icon"
                                title="Copy URL to the clipboard."
                                v-clipboard="item['@value']"
                                v-clipboard:success="clipboardSuccess"
                                v-clipboard:error="clipboardError">
                                <i
                                    v-if="showClipboardSuccessMessage"
                                    class="fa fa-check has-text-success" />
                                <i
                                    v-else
                                    class="fa fa-copy has-text-primary"
                                    name="copyURL"
                                    :expandedProperty="expandedProperty"
                                    :expandedValue="expandedValue" />
                            </span>
                        </p>
                        <p class="control is-expanded">
                            <span class="uneditable">
                                {{ item['@id'] || item['@value'] }}
                            </span>
                        </p>
                        <p
                            class="control delete-property-button"
                            v-if="editingProperty">
                            <span
                                :disabled="shortType === 'id'"
                                @click="showModal('remove', index)"
                                class="button disabled is-outlined is-small is-danger">
                                <i class="fa fa-times" />
                            </span>
                        </p>
                    </div>
                </div>
                <!-- non editable string -->
                <div
                    class="editing-string__read-only"
                    v-else-if="editingProperty && typeof(item) === 'String' && profile && profile[expandedProperty] && (profile[expandedProperty]['noTextEditing'] === 'true'
                        || profile[expandedProperty]['readOnly'] === 'true' || profile[expandedProperty]['noTextEditing'] === true || profile[expandedProperty]['readOnly'] === true)">
                    <div class="field">
                        <div class="control">
                            <div class="uneditable">
                                {{ item }}
                            </div>
                        </div>
                    </div>
                    <div
                        v-if="editingProperty"
                        class="field delete-property-button">
                        <div class="control">
                            <label><br></label>
                            <div
                                @click="showModal('remove', item)"
                                class="button is-text has-text-danger">
                                <i class="fa fa-times" />
                            </div>
                        </div>
                    </div>
                </div>
                <!-- non editable not string -->
                <div
                    class="editing-non-string__read-only"
                    v-else-if="editingProperty && profile && profile[expandedProperty] && (profile[expandedProperty]['noTextEditing'] === 'true'
                        || profile[expandedProperty]['readOnly'] === 'true' || profile[expandedProperty]['noTextEditing'] === true || profile[expandedProperty]['readOnly'] === true)">
                    <div class="field">
                        <div class="control">
                            <div class="uneditable">
                                {{ item["@value"] }}
                            </div>
                        </div>
                    </div>
                </div>
                <!-- propertystring components -->
                <div
                    class="property"
                    v-else-if="editingProperty && !checkedOptions">
                        <PropertyString
                            :index="index"
                            :expandedProperty="expandedProperty"
                            :expandedThing="expandedThing"
                            :langString="langString"
                            :range="range"
                            :options="(profile && profile[expandedProperty] && profile[expandedProperty]['options']) ? profile[expandedProperty]['options'] : null"
                            :profile="profile"
                            @remove="remove(item)" />
                </div>
                <!-- text view has language -->
                <div
                    class="expanded-view__has-language"
                    v-else-if="isObject(expandedValue[index]) && expandedValue[index]['@language']">
                    <span class="language">
                        {{ expandedValue[index]["@language"] + ": " }}
                    </span>
                    <span class="value">
                        {{ expandedValue[index]["@value"] }}
                    </span>
                </div>
                <!-- text view doesn't have language -->
                <div
                    class="expanded-view-property"
                    v-else-if="isObject(expandedValue[index])">
                    <div class="property">
                        {{ expandedValue[index]["@value"] }}
                    </div>
                </div>
                <div
                    class="unexpanded-property"
                    v-else>
                    <div class="property">
                        {{ expandedValue[index] }}
                    </div>
                </div>
            </div>
            <template v-if="editingProperty && checkedOptions && show && profile && profile[expandedProperty] && profile[expandedProperty]['options']">
                <div
                    v-for="each in profile[expandedProperty]['options']"
                    :key="each">
                    <input
                        type="checkbox"
                        v-model="checkedOptions"
                        :value="each.val"
                        :id="each.val">
                    <label :for="each.val">
                        {{ getBlocking(each.val).name }}
                    </label>
                </div>
            </template>
        </template>
        <template
            v-else>
            <div class="property-value">
                <div
                    class="add-property-button"
                    v-if="canEdit">
                    <button
                        v-if="range.length == 0 && addOrSearch !== 'search'"
                        class="button is-small is-link has-text-info"
                        :title="'Add New '+ displayLabel"
                        @click.stop="add('string'); startEditing();">
                        <span class="icon">
                            <i
                                class="fa fa-plus has-text-info"
                                aria-hidden="true" />
                        </span>
                        <span>
                            Add {{ displayLabel }}
                        </span>
                    </button>
                    <button
                        v-for="(targetType) in range"
                        :key="targetType"
                        v-else-if="addOrSearch !== 'search'"
                        class="button is-small is-text has-text-info"
                        @click.stop="add(targetType); startEditing();"
                        :title="'Add New '+ displayLabel">
                        <span class="icon has-text-dark">
                            <i
                                class="fa fa-plus has-text-info"
                                aria-hidden="true" />
                        </span>
                        <span>
                            Add {{ displayLabel }}
                        </span>
                    </button>
                </div>
            </div>
        </template>
    </div>
</template>
<script>
export default {
    // Property represents one property of a Thing.
    name: 'Property',
    props: {
        // The expandedThing that we're a property of.
        expandedThing: Object,
        // Our fully qualified property id (relative to this.expandedThing)
        expandedProperty: String,
        // The schema segment that describes us.
        schema: Object,
        // Whether the thing is editable by the current user.
        canEdit: Boolean,
        // Application profile, to pass along to the Thing children we have.
        profile: Object,
        editingThing: Boolean,
        validate: Boolean
    },
    data: function() {
        return {
            clickToLoad: true,
            showClipboardSuccessMessage: false,
            // True if we are in edit mode.
            show: true,
            langString: false,
            addOrSearch: null,
            checkedOptions: null,
            initialValue: null
        };
    },
    components: {
        // Circular references require this trick.
        Thing: () => import('./Thing.vue'),
        ThingEditing: () => import('./ThingEditing.vue'),
        // Property editing box for String type things. Should be one of these for each value type.
        PropertyString: () => import('./PropertyString.vue')
    },
    created: function() {
        if (this.editingThing) {
            if (this.range.length === 1 && this.range[0].toLowerCase().indexOf("langstring") !== -1) {
                this.langString = true;
                for (var i = 0; i < this.expandedValue.length; i++) {
                    if (!this.expandedValue[i]["@language"]) {
                        this.$parent.update(this.expandedProperty, i, {"@language": this.$store.state.editor.defaultLanguage, "@value": this.expandedValue[i]["@value"]}, null);
                    }
                }
            }
            this.$store.commit('lode/incrementNumPropertyComponents', EcRemoteLinkedData.trimVersionFromUrl(this.expandedThing["@id"]));
        }
    },
    mounted: function() {
        if (this.range && this.range.length > 0 && this.range[0].toLowerCase().indexOf("level") !== -1 && this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]['options']) {
            this.checkedOptions = [];
            if (this.expandedValue.length > 0) {
                for (var i = 0; i < this.expandedValue.length; i++) {
                    this.checkedOptions.push(this.expandedValue[i]["@id"]);
                }
            }
        }
        if (this.expandedThing[this.expandedProperty]) {
            this.initialValue = JSON.parse(JSON.stringify(this.expandedThing[this.expandedProperty]));
        } else {
            this.initialValue = null;
        }
    },
    destroyed: function() {
        if (this.editingThing) {
            this.$store.commit('lode/decrementNumPropertyComponents', EcRemoteLinkedData.trimVersionFromUrl(this.expandedThing["@id"]));
        }
    },
    computed: {
        shortTypeAsClass: function() {
            return this.shortType.replace(/ /g, "_");
        },
        dynamicThing: function() {
            if (this.editingProperty) {
                return 'ThingEditing';
            } else {
                return 'Thing';
            }
        },
        isCompetency: function() {
            if (this.expandedThing["@type"][0].includes('Competency')) {
                return true;
            } else {
                return false;
            }
        },
        editingProperty: function() {
            return this.editingThing;
        },
        editingPropertyClass: function() {
            if (this.editingProperty) {
                return 'editing';
            } else {
                return '';
            }
        },
        childProfile: function() {
            var isFunction = function(obj) {
                return !!(obj && obj.constructor && obj.call && obj.apply);
            };
            if (this.schema == null) return null;
            var p = this.schema.profile;
            if (isFunction(p)) {
                p = p();
            }
            return p;
        },
        // Display label for the property.
        displayLabel: function() {
            // Look in schema first
            if (this.schema != null && this.schema["http://www.w3.org/2000/01/rdf-schema#label"] != null &&
            !EcArray.isArray(this.schema["http://www.w3.org/2000/01/rdf-schema#label"]) &&
            !EcObject.isObject(this.schema["http://www.w3.org/2000/01/rdf-schema#label"])) {
                return this.schema["http://www.w3.org/2000/01/rdf-schema#label"];
            }
            if (this.schema != null && this.schema["http://www.w3.org/2000/01/rdf-schema#label"] != null &&
            EcArray.isArray(this.schema["http://www.w3.org/2000/01/rdf-schema#label"]) &&
            EcObject.isObject(this.schema["http://www.w3.org/2000/01/rdf-schema#label"][0])) {
                return this.schema["http://www.w3.org/2000/01/rdf-schema#label"][0]["@value"];
            }
            if (this.schema != null && this.schema["http://www.w3.org/2000/01/rdf-schema#label"] != null &&
            EcObject.isObject(this.schema["http://www.w3.org/2000/01/rdf-schema#label"])) {
                return this.schema["http://www.w3.org/2000/01/rdf-schema#label"]["@value"];
            }

            // Make something up from the property name.
            var property = this.expandedProperty.split("/").pop();
            return property.replace(/([A-Z]+)/g, function(m) {
                return " " + m;
            }).toLowerCase().trim().replace(/(^| )(\w)/g, function(x) {
                return x.toUpperCase();
            });
        },
        // Description of the property, for hover or information hovers.
        comment: function() {
            if (this.schema == null) return null;
            if (this.schema['http://www.w3.org/2000/01/rdf-schema#comment'] == null) return null;
            if (this.schema['http://www.w3.org/2000/01/rdf-schema#comment'][0] == null) return null;
            return this.schema['http://www.w3.org/2000/01/rdf-schema#comment'][0]['@value'];
        },
        // The fully qualified property id.
        type: function() {
            if (this.schema == null) {
                if (this.expandedThing == null) {
                    return null;
                }
                return this.expandedThing["@type"][0];
            }
            return this.schema["@id"];
        },
        // The shortened (one word) property id.
        shortType: function() {
            if (!this.type) {
                return this.displayLabel;
            }
            var short = this.type.split("/").pop();
            if (short.indexOf("core#") !== -1) {
                short = this.type.split("#").pop();
            }
            return short;
        },
        // The namespace of the property id.
        context: function() {
            var ary = this.type.split("/");
            ary.pop();
            return ary.join("/");
        },
        // The permitted list of types that can go into this property.
        range: function() {
            // TODO: Inheritance tree
            if (this.schema == null) return [];
            var results = [];
            var ary = this.schema["http://schema.org/rangeIncludes"];
            if (ary != null || ary !== undefined) {
                for (var i = 0; i < ary.length; i++) {
                    results.push(ary[i]["@id"]);
                }
            }
            return results;
        },
        // The current value(s) of the property based on the expanded thing.
        expandedValue: {
            get: function() {
                var expanded = this.expandedThing[this.expandedProperty];
                if (this.expandedProperty.indexOf("@") === 0) {
                    if (this.expandedProperty === "@id") {
                        expanded = [{"@value": EcRemoteLinkedData.trimVersionFromUrl(this.expandedThing[this.expandedProperty])}];
                    } else {
                        expanded = [{"@value": this.expandedThing[this.expandedProperty]}];
                    }
                }
                if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["valuesIndexed"]) {
                    expanded = [];
                    var f = this.profile[this.expandedProperty]["valuesIndexed"];
                    f = f();
                    var shortId = EcRemoteLinkedData.trimVersionFromUrl(this.expandedThing["@id"]);
                    if (f && f[shortId]) {
                        return f[shortId];
                    }
                    return [];
                }
                return expanded;
            }
        },
        // Checks cardinality of the property and doesn't allow user to add more than one value when max is 1
        canAdd: function() {
            if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["max"] === 1) {
                if (this.expandedValue.length === 1) {
                    return false;
                }
            }
            if (!this.editingProperty) {
                return false;
            }
            return this.canEdit;
        },
        // Used to remove click event when item should not be edited. Necessary because of event propagation and nested components.
        clickHandler: function() {
            if (this.canEdit) {
                return "click";
            } else {
                return null;
            }
        },
        objectType: function() {
            if (this.range[0].toLowerCase().indexOf('level') === -1) {
                return "Competency";
            } else {
                return "Level";
            }
        }
    },
    methods: {
        clipboardSuccess: function() {
            let self = this;
            this.showClipboardSuccessMessage = true;
            setTimeout(() => {
                self.showClipboardSuccessMessage = false;
            }, 2000);
        },
        clipboardError: function() {
            this.$emit('clipboardErrorEvent');
        },
        stopEditing: function() {
            if (this.profile && this.profile[this.expandedProperty] && (this.profile[this.expandedProperty]["isRequired"] === 'true' || this.profile[this.expandedProperty]["isRequired"] === true)) {
                if (this.expandedValue.length === 0 || (this.expandedValue[0]["@value"] != null && this.expandedValue[0]["@value"] !== undefined && this.expandedValue[0]["@value"].trim().length === 0)) {
                    this.showModal("required");
                    return;
                }
            }
            if (this.range.length === 1 && (this.range[0] === "http://schema.org/URL" || this.range[0] === "https://schema.cassproject.org/0.4/skos/Concept")) {
                for (var i = 0; i < this.expandedValue.length; i++) {
                    if (this.expandedValue[i]["@value"] && this.expandedValue[i]["@value"].indexOf("http") === -1) {
                        return this.showModal("urlOnly");
                    } else if (this.expandedValue[i]["@id"] && this.expandedValue[i]["@id"].indexOf("http") === -1) {
                        return this.showModal("urlOnly");
                    }
                }
            }
            this.addOrSearch = null;
            if (this.range.length === 1 && this.range[0].toLowerCase().indexOf("langstring") !== -1) {
                for (var i = 0; i < this.expandedValue.length; i++) {
                    if (this.expandedValue[i]["@language"] == null || this.expandedValue[i]["@language"] === undefined || this.expandedValue[i]["@language"].trim().length === 0) {
                        return this.showModal("langRequired");
                    }
                }
                if (this.profile && this.profile[this.expandedProperty] && (this.profile[this.expandedProperty]["onePerLanguage"] === 'true' || this.profile[this.expandedProperty]["onePerLanguage"] === true)) {
                    var languagesUsed = [];
                    for (var i = 0; i < this.expandedValue.length; i++) {
                        if (languagesUsed.includes(this.expandedValue[i]["@language"].toLowerCase())) {
                            return this.showModal("onePerLanguage");
                        }
                        languagesUsed.push(this.expandedValue[i]["@language"].toLowerCase());
                    }
                }
            }
            for (var i = this.expandedValue.length - 1; i >= 0; i--) {
                if (this.expandedValue[i] === null || (this.expandedValue[i]["@value"] !== null && this.expandedValue[i]["@value"] !== undefined && this.expandedValue[i]["@value"].length === 0) || this.expandedValue[i].length === 0) {
                    this.expandedValue.splice(i, 1);
                }
            }
            this.save();
            if (this.validate) {
                this.$emit('validated', true);
            }
        },
        startEditing: function() {
            if (this.canEdit && !this.editingProperty) {
                this.editingProperty = true;
                this.editingPropertyClass = "editing";
                this.$emit('editingPropertyEvent', true);
            }
            if (this.range.length === 1 && this.range[0].toLowerCase().indexOf("langstring") !== -1) {
                this.langString = true;
                for (var i = 0; i < this.expandedValue.length; i++) {
                    if (!this.expandedValue[i]["@language"]) {
                        this.update({"@language": this.$store.state.editor.defaultLanguage, "@value": this.expandedValue[i]["@value"]}, i);
                    }
                }
            }
        },
        /*
         * initialize modal with params this depends on
         * ./plugins/modalPlugin.js;
         * and ./components/CassModal.vue;
         * can further breakout if we decide to use vuex // plugin is global
         */
        showModal(val, item) {
            this.$emit('invalid', true);
            let params = {};
            if (val === 'remove') {
                if (this.profile && this.profile[this.expandedProperty] && (this.profile[this.expandedProperty]["isRequired"] === 'true' || this.profile[this.expandedProperty]["isRequired"] === true)) {
                    if (this.expandedValue.length === 1 || (this.expandedValue["@value"] && this.expandedValue["@value"].trim().length === 1)) {
                        this.showModal("required");
                        return;
                    }
                }
                params = {
                    type: val,
                    title: "Remove property",
                    text: "Remove this property?",
                    onConfirm: () => {
                        return this.remove(item);
                    }
                };
            }
            if (val === 'required') {
                params = {
                    type: val,
                    title: "Required property",
                    text: "This property is required. Please enter a value."
                };
            }
            if (val === "urlOnly") {
                params = {
                    type: val,
                    title: "URL Required",
                    text: "This property must be a URL. For example: https://credentialengineregistry.org/, https://eduworks.com, https://case.georgiastandards.org/."
                };
            }
            if (val === "langRequired") {
                params = {
                    type: val,
                    title: "Language Required",
                    text: "This property must have a language."
                };
            }
            if (val === "onePerLanguage") {
                params = {
                    type: val,
                    title: "One value per language",
                    text: "This field can only have one entry per language."
                };
            }
            // reveal modal
            this.$modal.show(params);
        },
        add: function(type) {
            if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["add"]) {
                this.addOrSearch = "add";
                var f = this.profile[this.expandedProperty]["add"];
                if (f === "checkedOptions") {
                    // eslint-disable-next-line no-useless-return
                    return;
                } else {
                    var shortId = EcRemoteLinkedData.trimVersionFromUrl(this.expandedThing["@id"]);
                    f(shortId);
                }
            } else if (type.toLowerCase().indexOf("langstring") !== -1) {
                this.addOrSearch = "add";
                var lang = "";
                if (this.$store.state.editor) {
                    lang = this.$store.state.editor.defaultLanguage;
                }
                this.$parent.add(this.expandedProperty, {"@language": lang, "@value": ""});
                this.langString = true;
            } else if (type.toLowerCase().indexOf("string") !== -1 || type.toLowerCase().indexOf("url") !== -1 || type.toLowerCase().indexOf("text") !== -1 ||
                type.toLowerCase().indexOf("date") !== -1 || type.toLowerCase().indexOf("concept") !== -1) {
                this.addOrSearch = "add";
                this.$parent.add(this.expandedProperty, {"@value": ""});
            } else {
                this.addOrSearch = "add";
                var rld = new EcRemoteLinkedData();
                rld.context = this.context;
                rld.type = type.split("/").pop();
                this.$parent.add(this.expandedProperty, rld);
            }
        },
        remove: function(index) {
            if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["remove"]) {
                var f = this.profile[this.expandedProperty]["remove"];
                var value = EcObject.isObject(this.expandedValue[index]) ? this.expandedValue[index]["@id"] : this.expandedValue[index];
                f(EcRemoteLinkedData.trimVersionFromUrl(this.expandedThing["@id"]), value);
            } else {
                this.$parent.remove(this.expandedProperty, index);
            }
        },
        updatePropertyString(input, index) {
            this.update(input, index);
        },
        update: function(input, index) {
            var me = this;
            this.$parent.update(this.expandedProperty, index, input, function() {
                me.stopEditing();
            });
        },
        isText: function(type) {
            if (type == null || type === undefined) return null;
            if (type["@value"] != null && type["@value"] !== undefined) {
                return true;
            }
            if (type["@type"] !== undefined && type["@type"] !== null) {
                if (type["@type"][0].toLowerCase().indexOf("text") !== -1) { return true; }
                if (type["@type"][0].toLowerCase().indexOf("url") !== -1) { return true; }
                if (type["@type"][0].toLowerCase().indexOf("concept") !== -1) { return true; }
                if (type["@type"][0].toLowerCase().indexOf("string") !== -1) { return true; }
            }
            if (type["@id"] != null && type["@id"] !== undefined) { return true; }
            return false;
        },
        isLink: function(type) {
            if (EcObject.keys(type).length === 1) {
                if (type["@id"] != null && type["@id"] !== undefined) {
                    return true;
                } else if (type["@value"] && type["@value"].indexOf("http") === 0) {
                    return true;
                }
            }
            return false;
        },
        save: function() {
            if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["save"]) {
                var f = this.profile[this.expandedProperty]["save"];
                if (this.checkedOptions) {
                    f(this.expandedThing, this.checkedOptions, this.profile[this.expandedProperty]["options"]);
                }
            } else {
                if (this.expandedProperty.indexOf('@') === -1 && !this.validate) {
                    var changed = false;
                    for (var i = 0; i < this.expandedValue.length; i++) {
                        if (this.expandedValue[i]["@id"] !== this.initialValue[i]["@id"] || this.expandedValue[i]["@value"] !== this.initialValue[i]["@value"] || this.expandedValue[i]["@language"] !== this.initialValue[i]["@language"]) {
                            changed = true;
                            break;
                        }
                    }
                    if (changed) {
                        this.$store.commit('editor/addEditsToUndo',
                            {operation: "update", id: EcRemoteLinkedData.trimVersionFromUrl(this.expandedThing["@id"]), fieldChanged: [this.expandedProperty], initialValue: this.initialValue, changedValue: this.expandedValue, expandedProperty: true}
                        );
                    }
                }
                this.$parent.save();
            }
        },
        isObject: function(k) { return EcObject.isObject(k); },
        deleteObject: function(thing) {
            this.$emit('deleteObject', thing);
        },
        getBlocking: function(id) {
            return EcRepository.getBlocking(id);
        }
    },
    watch: {
        canEdit: function() {
            if (this.canEdit === false) {
                this.editingProperty = false;
            }
        },
        validate: function() {
            if (this.validate) {
                this.stopEditing();
            }
        },
        checkedOptions: function() {
            this.save();
        }
    }
};
</script>
