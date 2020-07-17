<template>
    <div>
        <!-- language modifier -->
        <div
            class="field"
            v-if="showLanguage">
            <div
                class="control is-narrow auto-complete__control">
                <label class="label">language</label>
                <input
                    v-if="showLanguage"
                    ref="language"
                    class="input is-narrow is-small"
                    v-model="search"
                    @input="onSearchChange"
                    @blur="blur">
                <span class="auto-complete">
                    <ul v-show="isOpen">
                        <li
                            v-for="(result, i) in filtered"
                            :key="i"
                            @mousedown="setLanguage(result)">
                            {{ result.display }}
                        </li>
                    </ul>
                </span>
            </div>
        </div>
        <div class="field">
            <p
                v-if="showLanguage"
                class="control">
                <!-- to do match to property name -->
                <label class="label">Value</label>
                <textarea
                    ref="textarea"
                    class="textarea is-expanded "
                    rows="3"
                    v-model="computedText"
                    @blur="blur" />
            </p>
        </div>
        <div
            class="field"
            v-if="showLanguage">
            <div
                class="buttons is-right"
                v-if="!addSingle">
                <div
                    @click="showModal('remove')"
                    class="button is-outlined is-small is-danger">
                    <span class="icon">
                        <i class="fa fa-times" />
                    </span>
                </div>
            </div>
        </div>
        <!-- resource -->
        <div
            class="field"
            v-if="isResource">
            <div class="property">
                {{ computedResourceId }}
            </div>
        </div>
        <div
            class="field"
            v-if="isResource">
            <div
                class="control">
                <label class="label">Resource Name</label>
                <textarea
                    class="textarea is-expanded "
                    rows="1"
                    v-model="computedResourceName"
                    @blur="blur" />
            </div>
        </div>
        <div
            class="field"
            v-if="isResource">
            <div
                class="buttons is-right"
                v-if="!addSingle">
                <div
                    @click="showModal('remove')"
                    class="button is-outlined is-small is-danger">
                    <span class="icon">
                        <i class="fa fa-times" />
                    </span>
                </div>
            </div>
        </div>
        <!-- timestamp -->
        <label
            class="label"
            v-if="range[0] === 'http://www.w3.org/2001/XMLSchema#dateTime'">date/time</label>
        <input
            v-if="range[0] === 'http://www.w3.org/2001/XMLSchema#dateTime'"
            class="input is-small is-fullwidth date-time"
            v-model="computedText"
            type="datetime-local"
            @blur="blur">
        <label
            class="label"
            v-if="options">options</label>
        <span
            class="select is-small"
            v-if="options">
            <select
                v-model="computedText"
                @blur="blur">
                <option
                    v-for="item in options"
                    :key="item"
                    :value="item.val">
                    {{ item.display }}
                </option>
            </select>
        </span>
        <template v-if="!showLanguage">
            <div class="control is-expanded">
                <label
                    class="label">Value</label>
                <textarea
                    v-if="!showLanguage"
                    ref="textarea"
                    class="textarea is-expanded "
                    rows="1"
                    v-model="computedText"
                    @blur="blur" />
            </div>
            <div
                class="control is-narrow delete-property-button"
                v-if="!addSingle">
                <label><br></label>
                <div
                    @click="showModal('remove')"
                    class="button is-outlined is-small is-danger is-pulled-right">
                    <i class="fa fa-times" />
                </div>
            </div>
        </template>
    </div>
</template>

<script>
const languagesFile = require('../../ietf-language-tags_json.json');
export default {
    name: 'PropertyString',
    props: {
        expandedThing: Object,
        expandedProperty: String,
        schema: Object,
        index: null,
        langString: null,
        range: null,
        options: null,
        newProperty: Boolean,
        profile: Object,
        // True if adding a single property
        addSingle: Boolean,
        valueFromSearching: null
    },
    created: function() {
    },
    data: function() {
        var property;
        if (this.newProperty === true) {
            property = "";
        } else {
            property = this.expandedThing[this.expandedProperty];
        }
        if (EcArray.isArray(property)) {
            return {
                text: this.expandedThing[this.expandedProperty][this.index],
                indexInternal: this.index,
                isOpen: false,
                search: "",
                languages: [],
                filtered: [],
                isResource: false
            };
        } else {
            return {
                text: property,
                indexInternal: null,
                isOpen: false,
                search: "",
                languages: [],
                filtered: [],
                isResource: false
            };
        }
    },
    mounted: function() {
        this.search = this.computedLanguage;
        if (this.computedLanguage || this.langString) {
            for (var i = 0; i < languagesFile.length; i++) {
                var tag = {};
                tag.tag = languagesFile[i].subtag;
                tag.display = languagesFile[i].description;
                this.languages.push(tag);
            }
            if (this.newProperty === true) {
                this.text = {};
                if (this.$store.state.editor) {
                    this.computedLanguage = this.$store.state.editor.defaultLanguage;
                    this.search = this.computedLanguage;
                }
            }
        } else if (this.newProperty === true && this.range[0] === "http://schema.org/Text" && !this.options) {
            this.text = {};
        }
        if (this.valueFromSearching) {
            this.text = this.valueFromSearching;
        }
        if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["resource"]) {
            this.isResource = true;
            this.text = {};
        }
    },
    computed: {
        showLanguage: function() {
            if (this.computedLanguage || this.langString) {
                return true;
            } else {
                return false;
            }
        },
        computedText: {
            get: function() {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@value"] === undefined) {
                        return null;
                    }
                    if (this.range[0] === 'http://www.w3.org/2001/XMLSchema#dateTime' && this.text["@value"].length > 16) {
                        return this.text["@value"].substr(0, 16);
                    }
                    return this.text["@value"];
                }
                return this.text;
            },
            set: function(value) {
                if (EcObject.isObject(this.text)) {
                    this.text["@value"] = value;
                } else {
                    this.text = value;
                }
            }
        },
        computedLanguage: {
            get: function() {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@language"] === undefined) {
                        return null;
                    }
                    return this.text["@language"];
                }
                return null;
            },
            set: function(value) {
                if (EcObject.isObject(this.text)) {
                    this.text["@language"] = value;
                }
            }
        },
        computedResourceName: {
            get: function() {
                if (EcObject.isObject(this.text)) {
                    if (this.text["name"] === undefined) {
                        return null;
                    }
                    return this.text["name"];
                }
                return null;
            },
            set: function(value) {
                if (EcObject.isObject(this.text)) {
                    this.text["name"] = value;
                }
            }
        },
        computedResourceId: function() {
            if (this.isResource && EcObject.isObject(this.text) && this.text["@id"]) {
                return this.text["@id"];
            }
            return null;
        }
    },
    watch: {
        text: function(newValue, oldValue) {
        }
    },
    methods: {
        blur: function() {
            this.$parent.updatePropertyString(this.text, this.indexInternal);
            this.isOpen = false;
        },
        onSearchChange: function() {
            if (this.search.length >= 2) {
                this.isOpen = true;
                this.filterResults();
            }
        },
        filterResults: function() {
            this.filtered = this.languages.filter(item => item.display.toLowerCase().indexOf(this.search.toLowerCase()) !== -1);
        },
        setLanguage: function(language) {
            this.computedLanguage = language.tag;
            this.search = language.display;
            this.isOpen = false;
            this.blur();
        },
        showModal(val) {
            let params = {};
            let expandedValue;
            let me = this;
            if (this.expandedThing) {
                expandedValue = this.expandedThing[this.expandedProperty];
            }
            if (val === 'remove') {
                if (expandedValue && this.profile && this.profile[this.expandedProperty] && (this.profile[this.expandedProperty]["isRequired"] === 'true' || this.profile[this.expandedProperty]["isRequired"] === true)) {
                    if (expandedValue.length === 1 || (expandedValue["@value"] && expandedValue["@value"].trim().length === 1)) {
                        this.showModal("required");
                        return;
                    }
                }
                if (!this.newProperty) {
                    params = {
                        type: val,
                        title: "Remove property",
                        text: "Remove this property?",
                        onConfirm: () => {
                            return me.$emit('remove');
                        }
                    };
                } else {
                    return me.$emit('remove');
                }
            }
            if (val === 'required') {
                params = {
                    type: val,
                    title: "Required property",
                    text: "This property is required. It cannot be removed."
                };
            }
            // reveal modal
            this.$modal.show(params);
        }
    }
};
</script>