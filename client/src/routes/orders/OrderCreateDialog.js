import React from 'react';
import gql from 'graphql-tag';
import { Query, graphql } from 'react-apollo';
import { Form as FormLogic, Field, FieldArray } from '@8base/forms';
import {
  Dialog,
  Grid,
  Button,
  SelectField,
  InputField,
  DateInputField,
  ModalContext,
  Icon,
  Heading,
} from '@8base/boost';
import { OrderItemsField } from '../order/OrderItemsField';

const ORDER_CREATE_MUTATION = gql`
  mutation OrderCreate($data: OrderCreateInput!) {
    orderCreate(data: $data) {
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

const enhancer = graphql(ORDER_CREATE_MUTATION, {
  name: 'orderCreate',
  options: {
    refetchQueries: ['OrdersTableContent', 'OrdersList'],
    context: {
      TOAST_SUCCESS_MESSAGE: 'Order successfully created',
    },
  },
});

const OrderCreateDialog = enhancer(
  class OrderCreateDialog extends React.PureComponent {
    static contextType = ModalContext;

    onSubmit = async data => {
      await this.props.orderCreate({ variables: { data } });

      this.context.closeModal('ORDER_CREATE_DIALOG_ID');
    };

    onClose = () => {
      this.context.closeModal('ORDER_CREATE_DIALOG_ID');
    };

    renderFormContent = ({ handleSubmit, invalid, submitting, pristine }) => (
      <form onSubmit={handleSubmit} style={{ height: '100%' }}>
        <Dialog.Header title="New Order" onClose={this.onClose} />
        <Dialog.Body>
          <Grid.Layout gap="md">
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
            {/* <Grid.Box> */}
            <Query query={PRODUCTS_LIST_QUERY}>
              {({ data, loading }) => {
                return (
                  <FieldArray name={'orderItems'}>
                    {({ fields }) => {
                      const fieldsValue = fields.value ? fields.value : [];
                      const productOptions = loading
                        ? []
                        : data.productsList.items.map(({ id: value, name: label, price }) => ({
                            value,
                            label,
                            price,
                          }));
                      const filterdProductsOptions = productOptions.filter(product => {
                        return !fieldsValue.some(orderItem => orderItem.product.id === product.value);
                      });
                      return (
                        <>
                          <Heading type="h5" text="Order Items:" />
                          {fieldsValue.length === 0 && <div>No Order Items have been applied to this Order</div>}
                          {fields.map((name, fieldIndex) => {
                            const {
                              product: {
                                id: currentOrderItemId,
                                name: currentOrderItemName,
                                price: currentOrderItemPrice,
                              },
                            } = fieldsValue[fieldIndex];
                            const currentProduct = {
                              label: currentOrderItemName,
                              value: currentOrderItemId,
                              price: currentOrderItemPrice,
                            };
                            return (
                              <Grid.Box>
                                <Field
                                  key={fieldIndex}
                                  name={name}
                                  displayLabel={fieldIndex === 0}
                                  component={OrderItemsField}
                                  productOptions={[...filterdProductsOptions, currentProduct]}
                                  deleteOrderItem={() => fields.remove(fieldIndex)}
                                />
                              </Grid.Box>
                            );
                          })}
                          <Heading
                            type="h5"
                            text={`Total: $${Math.round(
                              fieldsValue.reduce((sum, current) => {
                                const {
                                  product: { price },
                                  quantity,
                                } = current;
                                return sum + price * quantity;
                              }, 0) * 100
                            ) / 100}`}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              const { label, value, price } = filterdProductsOptions[0];
                              fields.push({
                                product: {
                                  id: value,
                                  price,
                                  name: label,
                                },
                                quantity: 1,
                              });
                            }}
                          >
                            <Icon name="Add" />
                            Add Order Item
                          </Button>
                        </>
                      );
                    }}
                  </FieldArray>
                );
              }}
            </Query>
            {/* </Grid.Box> */}
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
        </Dialog.Body>
        <Dialog.Footer>
          <Button color="neutral" type="button" variant="outlined" disabled={submitting} onClick={this.onClose}>
            Cancel
          </Button>
          <Button color="primary" type="submit" loading={submitting}>
            Create Order
          </Button>
        </Dialog.Footer>
      </form>
    );

    render() {
      return (
        <Dialog id={'ORDER_CREATE_DIALOG_ID'} size="md" stretch>
          <FormLogic type="CREATE" tableSchemaName="Orders" onSubmit={this.onSubmit} formatRelationToIds>
            {this.renderFormContent}
          </FormLogic>
        </Dialog>
      );
    }
  }
);

export { OrderCreateDialog };
