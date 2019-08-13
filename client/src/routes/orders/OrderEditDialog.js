import React from 'react';
import gql from 'graphql-tag';
import { Query, graphql } from 'react-apollo';
import { Form as FormLogic, Field } from '@8base/forms';
import {
  AsyncContent,
  Dialog,
  Grid,
  Button,
  SelectField,
  InputField,
  DateInputField,
  ModalContext,
} from '@8base/boost';

import { OrderItemsField } from '../order/OrderItemsField';

const ORDER_QUERY = gql`
  query OrdersEntity($id: ID!) {
    order(id: $id) {
      id
      client {
        id
        _description
      }
      address
      deliveryDt
      comment
      orderItems {
        items {
          id
          product {
            id
            name
            price
          }
          quantity
        }
      }
      status
    }
  }
`;

const ORDER_UPDATE_MUTATION = gql`
  mutation OrderUpdate($data: OrderUpdateInput!) {
    orderUpdate(data: $data) {
      id
    }
  }
`;

const CLIENT_LIST_QUERY = gql`
  query ClientsList {
    clientsList: clientsList {
      items {
        id
        _description
      }
    }
  }
`;

const PRODUCTS_LIST_QUERY = gql`
  query ProductsList {
    productsList: productsList {
      items {
        id
        name
        price
        _description
      }
    }
  }
`;

const getRelationOptions = (items = []) =>
  items.map(item => ({ value: item.id, label: item._description || 'Untitled Record' }));

const ehnhancer = graphql(ORDER_UPDATE_MUTATION, {
  name: 'orderUpdate',
  options: {
    refetchQueries: ['OrdersTableContent', 'OrdersList'],
    context: {
      TOAST_SUCCESS_MESSAGE: 'Order successfully updated',
    },
  },
});

const OrderEditDialog = ehnhancer(
  class OrderEditDialog extends React.PureComponent {
    static contextType = ModalContext;

    updateOnSubmit = id => async data => {
      await this.props.orderUpdate({ variables: { data: { ...data, id } } });

      this.context.closeModal('ORDER_EDIT_DIALOG_ID');
    };

    onClose = () => {
      this.context.closeModal('ORDER_EDIT_DIALOG_ID');
    };

    renderForm = ({ args }) => {
      return (
        <Query query={ORDER_QUERY} variables={{ id: args.id }}>
          {({ data, loading }) => {
            const initialValues = {
              ...data.order,
              orderItems: data.order ? data.order.orderItems.items : [],
              client: data.order ? data.order.client.id : 0,
            };
            return (
              <FormLogic
                type="UPDATE"
                // tableSchemaName="Orders"
                onSubmit={this.updateOnSubmit(args.id)}
                initialValues={initialValues}
                // formatRelationToIds
              >
                {({ handleSubmit, invalid, submitting, pristine }) => (
                  <form onSubmit={handleSubmit}>
                    <Dialog.Header title="Edit Order" onClose={this.onClose} />
                    <Dialog.Body scrollable>
                      <AsyncContent loading={loading} stretch>
                        <Grid.Layout gap="md" stretch>
                          <Grid.Box>
                            <Query query={CLIENT_LIST_QUERY}>
                              {({ data, loading }) => (
                                <Field
                                  name="client"
                                  label="Client"
                                  multiple={false}
                                  component={SelectField}
                                  placeholder="Select a client"
                                  loading={loading}
                                  options={loading ? [] : getRelationOptions(data.clientsList.items)}
                                  stretch
                                />
                              )}
                            </Query>
                          </Grid.Box>
                          <Grid.Box>
                            <Field name="address" label="Address" component={InputField} />
                          </Grid.Box>
                          <Grid.Box>
                            <Field name="deliveryDt" label="Delivery Dt" withTime={true} component={DateInputField} />
                          </Grid.Box>
                          <Grid.Box>
                            <Field name="comment" label="Comment" component={InputField} />
                          </Grid.Box>
                          <Grid.Box>
                            <Query query={PRODUCTS_LIST_QUERY}>
                              {({ data, loading }) => {
                                return (
                                  <Field
                                    name="orderItems"
                                    label="Order Items"
                                    component={OrderItemsField}
                                    loading={loading}
                                    options={
                                      loading
                                        ? []
                                        : data.productsList.items.map(({ id: value, name: label, price }) => ({
                                            value,
                                            label,
                                            price,
                                          }))
                                    }
                                  />
                                );
                              }}
                            </Query>
                          </Grid.Box>
                          <Grid.Box>
                            <Field
                              name="status"
                              label="Status"
                              multiple={false}
                              component={SelectField}
                              options={[
                                { label: 'Opened', value: 'Opened' },
                                { label: 'Paid', value: 'Paid' },
                                { label: 'ReadyToDelivery', value: 'ReadyToDelivery' },
                                { label: 'Delivering', value: 'Delivering' },
                                { label: 'Closed', value: 'Closed' },
                                { label: 'Canceled', value: 'Canceled' },
                              ]}
                            />
                          </Grid.Box>
                        </Grid.Layout>
                      </AsyncContent>
                    </Dialog.Body>
                    <Dialog.Footer>
                      <Button
                        color="neutral"
                        type="button"
                        variant="outlined"
                        disabled={submitting}
                        onClick={this.onClose}
                      >
                        Cancel
                      </Button>
                      <Button color="primary" type="submit" disabled={pristine || invalid} loading={submitting}>
                        Update Order
                      </Button>
                    </Dialog.Footer>
                  </form>
                )}
              </FormLogic>
            );
          }}
        </Query>
      );
    };

    render() {
      return (
        <Dialog id={'ORDER_EDIT_DIALOG_ID'} size="md">
          {this.renderForm}
        </Dialog>
      );
    }
  }
);

export { OrderEditDialog };
