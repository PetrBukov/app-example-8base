import React from 'react';
import gql from 'graphql-tag';
import { Query, graphql, compose } from 'react-apollo';

import { Form as FormLogic, Field } from '@8base/forms';
import { Card, Grid, Heading, Loader, NoData, SelectField, InputField, DateInputField, Button } from '@8base/boost';

import { OrderCreateDialog } from '../orders/OrderCreateDialog';
import { OrderEditDialog } from '../orders/OrderEditDialog';
import { OrderDeleteDialog } from '../orders/OrderDeleteDialog';
import { OrderItemsField } from './OrderItemsField';

const ORDER_UPDATE_MUTATION = gql`
  mutation OrderUpdate($data: OrderUpdateInput!) {
    orderUpdate(data: $data) {
      id
    }
  }
`;

const ORDER_QUERY = gql`
  query GetOrderById($id: ID!) {
    order(id: $id) {
      id
      status
      createdAt
      updatedAt
      deliveryDt
      client {
        id
        firstName
        lastName
        email
      }
      address
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

const ORDER_ITEM_CREATE_MUTATION = gql`
  mutation orderItemsCreate($data: OrderItemCreateInput!) {
    orderItemCreate(data: $data) {
      id
    }
  }
`;

const getRelationOptions = (items = []) =>
  items.map(item => ({ value: item.id, label: item._description || 'Untitled Record' }));

const ehnhancer = compose(
  graphql(ORDER_UPDATE_MUTATION, {
    name: 'orderUpdate',
    options: {
      refetchQueries: ['GetOrderById'],
      context: {
        TOAST_SUCCESS_MESSAGE: 'Order successfully updated',
      },
    },
  }),
  graphql(ORDER_ITEM_CREATE_MUTATION, {
    name: 'orderItemCreate',
  })
);

const Order = ehnhancer(
  class Order extends React.PureComponent {
    updateOnSubmit = id => async data => {
      const { address, client, comment, deliveryDt, orderItems, status } = data;
      const oldOrderItems = orderItems
        .filter(orderItem => orderItem.id)
        .map(orderItem => ({
          id: orderItem.id,
        }));
      const newOrderItems = orderItems.filter(orderItem => !orderItem.id);
      if (newOrderItems.length > 0) {
        newOrderItems.forEach(async orderItem => {
          await this.props.orderItemCreate({
            variables: {
              data: {
                product: {
                  connect: { id: orderItem.product.id },
                },
                order: {
                  connect: {
                    id,
                  },
                },
                quantity: orderItem.quantity,
              },
            },
          });
        });
      }

      const updateData = {
        address,
        comment,
        deliveryDt,
        status,
        orderItems: {
          reconnect: oldOrderItems,
        },
        client: {
          reconnect: { id: client },
        },
      };
      await this.props.orderUpdate({ variables: { data: { ...updateData, id } } });
    };

    renderForm = order => {
      const initialValue = {
        ...order,
        orderItems: order.orderItems.items,
        client: order.client.id,
      };
      return (
        <Grid.Layout gap="md" stretch>
          <Grid.Box>
            <FormLogic
              type="UPDATE"
              // tableSchemaName="Orders"
              onSubmit={this.updateOnSubmit(order.id)}
              initialValues={initialValue}
              // formatRelationToIds
            >
              {test => {
                const { handleSubmit, invalid, submitting, pristine } = test;
                return (
                  <form onSubmit={handleSubmit}>
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
                        <Query query={PRODUCTS_LIST_QUERY}>
                          {({ data, loading }) => {
                            return (
                              <Field
                                name="orderItems"
                                label="Order Items"
                                component={OrderItemsField}
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
                        <Field name="deliveryDt" label="Delivery Dt" withTime={true} component={DateInputField} />
                      </Grid.Box>
                      <Grid.Box>
                        <Field name="comment" label="Comment" component={InputField} />
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
                      <Grid.Box>
                        <Button color="primary" type="submit" disabled={pristine || invalid} loading={submitting}>
                          Update Order Info
                        </Button>
                      </Grid.Box>
                    </Grid.Layout>
                  </form>
                );
              }}
            </FormLogic>
          </Grid.Box>
        </Grid.Layout>
      );
    };

    renderCard = ({ data, loading }) => {
      if (loading) {
        return <Loader stretch />;
      }
      if (!data || !data.order) {
        return <NoData />;
      }
      return (
        <Card padding="md">
          <Card.Header>
            <Heading type="h4" text=" Order info" />
          </Card.Header>

          <OrderCreateDialog />
          <OrderEditDialog />
          <OrderDeleteDialog />
          <Card.Body stretch scrollable>
            <Grid.Layout gap="md" stretch>
              <Grid.Box>{this.renderForm(data.order)}</Grid.Box>
              {/* <Grid.Box>
                <OrderItemsField input={{ value: data.order.orderItems }} />
              </Grid.Box> */}
            </Grid.Layout>
          </Card.Body>
        </Card>
      );
    };

    render() {
      const {
        computedMatch: {
          params: { orderId },
        },
      } = this.props;
      return (
        <Query query={ORDER_QUERY} variables={{ id: orderId }}>
          {this.renderCard}
        </Query>
      );
    }
  }
);

export { Order };
