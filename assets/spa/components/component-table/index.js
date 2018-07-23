Vue.component( 'wpuf-table', {
    template: '#tmpl-wpuf-component-table',
    mixins: [weForms.mixins.Loading, weForms.mixins.Paginate, weForms.mixins.BulkAction],
    props: {
        has_export: String,
        action: String,
        delete: String,
        id: [String, Number],
        status: [String],
    },

    data() {
        return {
            loading: false,
            columns: [],
            payment_form: '',
            items: [],
            ajaxAction: this.action,
            nonce: weForms.nonce,
            index: 'id',
            bulkDeleteAction: this.delete ? this.delete : 'weforms_form_entry_trash_bulk'
        };
    },

    created() {
        this.fetchData();
    },

    computed: {
        columnLength: function() {
            return Object.keys(this.columns).length;
        },
    },
    methods: {

        fetchData: function() {
            var self = this;

            this.loading = true;

            wp.ajax.send( self.action, {
                data: {
                    id: self.id,
                    page: self.currentPage,
                    status: self.status,
                    _wpnonce: weForms.nonce
                },
                success: function(response) {
                    self.loading        = false;
                    self.columns        = response.columns;
                    self.items          = response.entries;
                    self.form_title     = response.form_title;
                    self.payment_form   = response.payment_form;
                    self.totalItems     = response.pagination.total;
                    self.perPage        = response.pagination.per_page;
                    self.totalPage      = response.pagination.pages;

                    self.$emit('ajaxsuccess', response);
                },
                error: function(error) {
                    self.loading = false;
                    alert(error);
                }
            });
        },

        handleBulkAction: function() {
            if ( '-1' === this.bulkAction ) {
                alert( 'Please chose a bulk action to perform' );
                return;
            }

            if ( 'delete' === this.bulkAction ) {
                if ( ! this.checkedItems.length ) {
                    alert( 'Please select atleast one entry to delete.' );
                    return;
                }

                if ( confirm( 'Are you sure to delete the entries?' ) ) {
                    this.deleteBulk();
                }
            }

            if ( 'restore' === this.bulkAction ) {
                if ( ! this.checkedItems.length ) {
                    alert( 'Please select atleast one entry to restore.' );
                    return;
                }

                this.restoreBulk();
            }
        },
        restore: function(entry_id){
            var self = this;
            self.loading = true;

            wp.ajax.send( 'weforms_form_entry_restore', {
                data: {
                    entry_id: entry_id,
                    _wpnonce: weForms.nonce
                },
                success: function(response) {
                    self.loading = false;
                    self.fetchData();
                },
                error: function(error) {
                    self.loading = false;
                    alert(error);
                }
            });
        },
        deletePermanently: function(entry_id){

            if ( confirm( 'Are you sure to delete this entry?' ) ) {

                var self = this;
                self.loading = true;

                wp.ajax.send( 'weforms_form_entry_delete', {
                    data: {
                        entry_id: entry_id,
                        _wpnonce: weForms.nonce
                    },
                    success: function(response) {
                        self.loading = false;
                        self.fetchData();
                    },
                    error: function(error) {
                        self.loading = false;
                        alert(error);
                    }
                });
            }
        },
        filterBy: function() {
            var self            = this,
                filterBy        = document.querySelector('select[name="weforms_entry_filter_by"]').value;
                self.loading    = true;

            if ( '-1' === filterBy ) {
                self.loading = false;
                alert( wpuf_form_builder.i18n.filterByEmptyOption );
                return;
            }

            wp.ajax.send( 'weforms_form_entries', {
                data: {
                    id: self.id,
                    page: self.currentPage,
                    status: self.status,
                    filterby: filterBy,
                    _wpnonce: weForms.nonce
                },
                success: function(response) {
                    self.loading = false;
                    var entries = response.entries;

                    if ( entries.length !== 0 ) {
                        self.entryFilter( filterBy, entries );
                    }
                },
                error: function(error) {
                    self.loading = false;
                    alert(error);
                }
            });
        },
        entryFilter: function( filterBy, entries ) {
            var filteredEntries = [];

            switch (filterBy) {
              case 'payment_paid':
                filteredEntries = entries.filter( entry => entry.payment_status === 'completed' );
                break;
              case 'payment_unpaid':
                entries.forEach(function(entry){
                    if ( 'completed' !== entry.payment_status ) {
                        filteredEntries.push(entry);
                    }
                });
                break;
              default:
                filteredEntries = this.items;
            }

            this.items = filteredEntries;
        }
    },

    watch: {
        id: function(){
            this.fetchData();
        },
        status: function(){
            this.currentPage = 1;
            this.bulkAction = -1;
            this.fetchData();
        },
    }
} );
