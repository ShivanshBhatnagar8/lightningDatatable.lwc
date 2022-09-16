import { LightningElement, wire,api,track } from 'lwc';
import getAccountList from '@salesforce/apex/AccountController.getAccountList';   
import deleteAccounts from '@salesforce/apex/AccountController.deleteAccounts';
import getFilesByRecord from '@salesforce/apex/AccountController.getFilesByRecord';
import {NavigationMixin} from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi' ;
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import RATING_FIELD from '@salesforce/schema/Account.Rating';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';
import PHONE_FIELD from '@salesforce/schema/Account.Phone';

 
                             //Array for row Actions


const actions = [                            
    { label: 'Delete', name: 'delete'},
    { label: 'Edit', name: 'edit'}]
 
      //Columns for fields to be display in lightning DATATABLE
    const columns = [
    { label: 'Account Name', fieldName: NAME_FIELD.fieldApiName, type:'text', editable:'true' },
    { label: 'Rating', fieldName: RATING_FIELD.fieldApiName, type: 'text', editable:'true' },
    { label: 'Phone', fieldName: PHONE_FIELD.fieldApiName, type: 'phone', editable:'true' },
    { label: 'Industry', fieldName: INDUSTRY_FIELD.fieldApiName, type: 'text', editable:'true'  },
    { type: 'action',  typeAttributes: {  rowActions:actions }},
    { label:  'Preview',type: 'button',initialWidth: 135, typeAttributes: { label: 'Preview File', name: 'view_file', title: 'Click to View Details' }},
    {  label: 'Download',type: 'button-icon', initialWidth: 135,typeAttributes: { iconName: 'utility:download', name: 'download_file', title: 'Click to download' }}  
];  
export default class lightningAccountDataTable extends NavigationMixin (LightningElement) {
      
           
    //Javascript logic for Pagination in Datatable
   isLoading = false;
    @track page = 1   //1st page of the datatable
    @track items = [];  //it contains all the records.
    @track data=[]; //contains data to be displayed in a table 
    @track columns; //holds column info.
    @track startingRecord = 1; //start record position per page
    @track endingRecord = 0; //end record position per page
    @track pageSize = 10; //default value we are assigning, define how many record will be displayed in our table
    @track totalRecountCount = 0; //total record count received from all retrieved records
    @track totalPage = 0; //total number of page is needed to display all records
    @track Accounts;
    @track error;
    draftValues = []; // Contains record to update(for inline editing)
     @api recordId; //@api make property public.
   filesList = [];
    
     
     @wire(getFilesByRecord, {recordId: '$recordId'})
     wiredResult({data, error}){ 
         if(data){ 
            console.log(data)
            this.filesList = Object.keys(data).map(item=>({"label":data[item],
            "value": item,
            "url":`/sfc/servlet.shepherd/document/download/${item}`
           }))
           console.log(this.filesList)
           
           this.filesList.forEach(file => {
            file.downloadUrl = 'sfc/servlet.shepherd/document/download/'+file.value;
            console.log(file.url)
            console.log(file.value);
            console.log(file.downloadUrl)
            console.log(file);
            
           

           });
    
           
            }

     if(error){ 
        console.log(error)
    }
    }
      
    
     
     @wire (getAccountList)
      wiredAccounts({ data,error}) {
            if (data) {
               
                 
                this.items = data; //Assigning account's data coming from apex controller to items array
                this.totalRecountCount = data.length; //Assigning Account's record size to totalRecordCount i.e 560 records
                this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize); //here it is 56 total pages. Because totalRecord count is  560 and page size 
                //is 10 so 560/10 = 56 pages and Math.ceil() function is use to round up the value
                
                //initial data to be displayed ----------->
                //slice will take 0th element and ends with 10, but it doesn't include 10th element
                //so 0 to 9th rows will be displayed in the table
                this.data = this.items.slice(0,this.pageSize); //Here we are assigning the elements(which are the records) of item arrays to data array.
                this.endingRecord = this.pageSize; //page size is 10 and the ending record will be the 10th record of the page 
                this.columns = columns; // Assigning columns array  to columns variable to show data in the datatable
    
                this.error = undefined; // Assigning undefined value to an error variable
            } else if (error) {
                this.error = error; // Assigning value to an error parameter from error parameter, if any error occurs this condition will run
                this.data= undefined; // Assingning undefined value to data variable
            }
        }
    
        //clicking on previous button this method will be called
         previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1; //decrease page by 1
            this.displayRecordPerPage(this.page); //Calling  displayRecordPerPage() method
        }
    }

    //clicking on next button this method will be called
    nextHandler() {
        if((this.page<this.totalPage) && this.page !== this.totalPage){ //if current page is not equal to total page that is 56 page and less than 56 page then
            this.page = this.page + 1; //increase page by 1
            this.displayRecordPerPage(this.page);    //Calling  displayRecordPerPage() method        
        }             
    }

    //this method displays records page by page
    displayRecordPerPage(page){

        /*let's say for 2nd page, it will be => "Displaying 10 to 20 of 560 records. Page 2 of 56"
        page = 2; pageSize = 10; startingRecord  = 10, endingRecord = 20
        
        */
        this.startingRecord = ((page -1) * this.pageSize) ; //(2-1)*10 = 10
        this.endingRecord = (this.pageSize * page); //2*10 = 20

        this.endingRecord = (this.endingRecord >= this.totalRecountCount)   //Use of ternary Operator with a condition that if ending record is greater than or
                             ? this.totalRecountCount : this.endingRecord; // or equal to  recordcount then ending record will be
                                                                          //equal to the value of totalRecordCount i.e 56 or else if not then ending 
                                                                         // record will not change.

        this.data = this.items.slice(this.startingRecord, this.endingRecord); //so, slice(10,20) will give 10th to 19th records.
  
          this.startingRecord = this.startingRecord + 1;  //increment by 1 to display the startingRecord count, 
                                                         //so for 2nd page, it will show "Displaying 11 to 20 of 560 records. Page 2 of 56"
    }  
   
       
        
           
           //Javascript logic for inline editing 
        
        async handleSave(event) {
            
            const records = event.detail.draftValues.slice().map((draftValue) => {
                const fields = Object.assign({}, draftValue);
                return { fields };
                 
            });
    
        
            this.draftValues = [];
    
            try {
                
                const recordUpdatePromises = records.map((record) =>{
                   return  updateRecord(record)
                 } );
                await Promise.all(recordUpdatePromises);
    
                
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Accounts updated',
                        variant: 'success'
                    })
                );
    
                
                await refreshApex(this.wiredAccounts(this.data));
            } catch (error) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating or reloading Accounts',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            }

                     
        }

          //Row Action for Lightning DataTable
         handleRowAction(event) {
          
             const actionname = event.detail.action.name;
             const row = event.detail.row;
             this.recordId = row.Id;
             console.log(actionname);
               switch (actionname) {
                case 'view_file':
                     this. previewHandler(row);
                    
                     break;
                   case 'download_file':
                     this.downloadFile(row);
                     break;
                       case 'edit':
                        this[NavigationMixin.Navigate]({
                                     type: 'standard__recordPage',
                                     attributes: {
                                        recordId:this.recordId,
                                         actionname  :'edit'
                                     }
                                       
                                   })
                                   //console.log(JSON.stringify(this.recordId));
                        
                    break;
                   case 'delete':
                  this.deleteRecord(row);
                  break;
                  
           }
        }
         
       
    previewHandler(file){
      
        this[NavigationMixin.Navigate]({ 
            type:'standard__namedPage',
            attributes:{ 
                pageName:'filePreview'
            },
            state:{ 
                selectedRecordId:file.value
            
            }
            
        })
       
           
        
    }
         
        
        
            downloadFile(file){
                this[NavigationMixin.Navigate]({ 
                    type:'standard__webPage',
                    attributes:{ 
                        pageName:'fileDownload'
                    },
                    state:{ 
                        url:file.downloadUrl
                    
                    }
                });
                
         }
   
        
           
            deleteRecord(currentRow){
               
            deleteAccounts({acc:currentRow})
            
            .then(()=> {
                
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message:  'Account Deleted ',
                        variant: 'success'
                    })
                );

            //refresh data in the datatable
            return refreshApex(this.data);            
            })
            .catch((error)=>{
                this.error = error;
                console.log('error' ,JSON.stringify(this.error));
            });
            
}

    



}
