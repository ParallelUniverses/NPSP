import { LightningElement, api, track } from 'lwc';
import {apiNameFor, getSubsetObject, isEmptyObject, isNotEmpty, isUndefined} from 'c/utilCommon';

import DI_ADDITIONAL_OBJECT_JSON_FIELD from '@salesforce/schema/DataImport__c.Additional_Object_JSON__c';
import DI_DONATION_AMOUNT_FIELD from '@salesforce/schema/DataImport__c.Donation_Amount__c';
import DATA_IMPORT_PAYMENT_METHOD from '@salesforce/schema/DataImport__c.Payment_Method__c';

const PAYMENT_SCHEDULER_WIDGET = 'geFormWidgetPaymentScheduler';
const ALLOCATION_WIDGET = 'geFormWidgetAllocation';
const TOKENIZE_CARD_WIDGET = 'geFormWidgetTokenizeCard';
const WIDGET_LIST = [PAYMENT_SCHEDULER_WIDGET, ALLOCATION_WIDGET, TOKENIZE_CARD_WIDGET];

export default class GeFormWidget extends LightningElement {
    @api element;
    // TODO: Is this still in use?
    @api widgetData;

    @track widgetDataFromState = {};

    _formState = {};

    _allocationFields = [apiNameFor(DI_DONATION_AMOUNT_FIELD), apiNameFor(DI_ADDITIONAL_OBJECT_JSON_FIELD)];
    _elevateFields = [apiNameFor(DATA_IMPORT_PAYMENT_METHOD)];

    @api
    get formState() {
        return this._formState;
    }

    set formState(formState) {
        if (isEmptyObject(formState)) {
            return;
        }

        if (this.hasAllocationValuesChanged(formState)) {
            this.sliceWidgetDataFromFormState(formState, this._allocationFields);
        }

        if (this.hasElevateValuesChanged(formState)) {
            this.sliceWidgetDataFromFormState(formState, this._elevateFields);
        }

        this._formState = Object.assign({}, formState);
    }

    sliceWidgetDataFromFormState(formState, fields) {
        this.widgetDataFromState = getSubsetObject(formState, fields);
    }

    handleFormWidgetChange(event) {
        this.dispatchEvent(new CustomEvent('formwidgetchange', {detail: event.detail}))
    }

    hasElevateValuesChanged(formState) {
        const paymentMethodApiName = apiNameFor(DATA_IMPORT_PAYMENT_METHOD);
        if (!paymentMethodApiName) return false;

        const hasChanged = formState[paymentMethodApiName] !== this.formState[paymentMethodApiName];
        return hasChanged;
    }

    hasAllocationValuesChanged(formState) {
        const donationFieldApiName = apiNameFor(DI_DONATION_AMOUNT_FIELD);
        const additionalObjectFieldApiName = apiNameFor(DI_ADDITIONAL_OBJECT_JSON_FIELD)

        return formState[donationFieldApiName] !==
            this.formState[donationFieldApiName]
            ||
            formState[additionalObjectFieldApiName] !==
            this.formState[additionalObjectFieldApiName]
    }

    get isValid() {
        const thisWidget = this.widgetComponent;
        let isValid = false;
        if(thisWidget !== null && typeof thisWidget !== 'undefined'
            && typeof thisWidget.isValid === 'function') {
                isValid = thisWidget.isValid();
        } else if(isUndefined(thisWidget.isValid)) {
            // if no validation function defined, assume widget is valid
            return true;
        }
        return isValid;
    }

    get widgetComponent() {
        return this.template.querySelector('[data-id="widgetComponent"]');
    }

    get isPaymentScheduler() {
        return this.element.componentName === PAYMENT_SCHEDULER_WIDGET;
    }

    @api
    get isElevateTokenizeCard() {
        return this.element.componentName === TOKENIZE_CARD_WIDGET;
    }    

    get isAllocation() {
        return this.element.componentName === ALLOCATION_WIDGET;
    }

    get widgetNotFound(){
        return WIDGET_LIST.indexOf(this.element.componentName) < 0
    }

    @api
    get paymentToken() {
        const thisWidget = this.widgetComponent;
        if (this.isValid) {
            return thisWidget.paymentToken;
        }
    }

}