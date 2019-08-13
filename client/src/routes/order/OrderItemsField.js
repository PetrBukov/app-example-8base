import React from 'react';

import { Grid, Heading, Button, Select, Input, Icon, Label } from '@8base/boost';

class OrderItemsField extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      productValue: '',
      quantity: 1,
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (!state.productValue && props.options && props.options.length > 0) {
      return { productValue: props.options[0].value };
    }
    return null;
  }

  addProductToOrder = newProduct => {
    const {
      input: { value, onChange },
      options,
    } = this.props;
    onChange([...value, newProduct]);
    this.setState({
      productValue: options.length > 0 ? options[0].value : '',
      quantity: 1,
    });
  };

  deleteProductFromOrder = newOrderItems => {
    const {
      input: { onChange },
    } = this.props;
    onChange([...newOrderItems]);
  };

  render() {
    const { productValue, quantity } = this.state;
    const {
      input: { value },
      options,
    } = this.props;

    const productCost = productValue ? options.find(product => product.value === productValue).price : 0;
    return (
      <Grid.Layout gap="lg">
        <Grid.Box>
          {value &&
            value.map((product, currentIndex) => {
              const {
                product: { price, id: productId },
                quantity,
              } = product;

              return (
                <>
                  {currentIndex === 0 && <Heading type="h5" text="Order Items:" />}
                  <Grid.Layout gap="md" inline columns="2fr 1fr 1fr 1fr 50px" alignItems="end">
                    <Grid.Box>
                      <Grid.Layout>
                        <Grid.Box>
                          <Label text="Product name" kind="secondary" />
                        </Grid.Box>
                        <Grid.Box>
                          <Select
                            name="productName"
                            placeholder="Select an option"
                            options={options}
                            value={productId}
                            disabled
                          />
                        </Grid.Box>
                      </Grid.Layout>
                    </Grid.Box>
                    <Grid.Box>
                      <Grid.Layout>
                        <Grid.Box>
                          <Label text="Price" kind="secondary" />
                        </Grid.Box>
                        <Grid.Box>
                          <Input name="productPrice" type="number" value={price} min={0} disabled />
                        </Grid.Box>
                      </Grid.Layout>
                    </Grid.Box>
                    <Grid.Box>
                      <Grid.Layout>
                        <Grid.Box>
                          <Label text="Quantity" kind="secondary" />
                        </Grid.Box>
                        <Grid.Box>
                          <Input disabled name="productQuantity" type="number" value={quantity} min={1} />
                        </Grid.Box>
                      </Grid.Layout>
                    </Grid.Box>

                    <Grid.Box>
                      <Grid.Layout>
                        <Grid.Box>
                          <Label text="Total" kind="secondary" />
                        </Grid.Box>
                        <Grid.Box>
                          <Input name="totalCost" type="number" value={price * quantity} min={0} disabled />
                        </Grid.Box>
                      </Grid.Layout>
                    </Grid.Box>

                    <Grid.Box>
                      <Button
                        type="button"
                        size="sm"
                        color="danger"
                        onClick={() => {
                          const newOrderItems = value.filter((__, index) => index !== currentIndex);
                          this.deleteProductFromOrder(newOrderItems);
                        }}
                      >
                        <Icon name="Trashcan" />
                      </Button>
                    </Grid.Box>
                    {currentIndex + 1 === value.length && (
                      <Heading
                        type="h5"
                        text={`Total: $${value.reduce((sum, current) => {
                          const {
                            product: { price },
                            quantity,
                          } = current;
                          return sum + price * quantity;
                        }, 0)}`}
                      />
                    )}
                  </Grid.Layout>
                </>
              );
            })}
        </Grid.Box>
        {/* ////// */}
        <Grid.Box>
          <Heading type="h5" text="Add Order Item:" />
          <Grid.Layout gap="md" inline columns="2fr 1fr 1fr 1fr 50px" alignItems="end">
            <Grid.Box>
              <Grid.Layout>
                <Grid.Box>
                  <Label text="Product name" kind="secondary" />
                </Grid.Box>
                <Grid.Box>
                  <Select
                    name="productName"
                    placeholder="Select an option"
                    options={options}
                    value={productValue}
                    onChange={productValue => this.setState({ productValue })}
                  />
                </Grid.Box>
              </Grid.Layout>
            </Grid.Box>
            <Grid.Box>
              <Grid.Layout>
                <Grid.Box>
                  <Label text="Price" kind="secondary" />
                </Grid.Box>
                <Grid.Box>
                  <Input
                    name="productPrice"
                    type="number"
                    value={productCost}
                    onChange={quantity => this.setState({ quantity })}
                    min={0}
                    disabled
                  />
                </Grid.Box>
              </Grid.Layout>
            </Grid.Box>
            <Grid.Box>
              <Grid.Layout>
                <Grid.Box>
                  <Label text="Quantity" kind="secondary" />
                </Grid.Box>
                <Grid.Box>
                  <Input
                    name="productQuantity"
                    type="number"
                    value={quantity}
                    onChange={quantity => this.setState({ quantity })}
                    min={1}
                  />
                </Grid.Box>
              </Grid.Layout>
            </Grid.Box>

            <Grid.Box>
              <Grid.Layout>
                <Grid.Box>
                  <Label text="Total" kind="secondary" />
                </Grid.Box>
                <Grid.Box>
                  <Input name="totalCost" type="number" value={productCost * quantity} min={0} disabled />
                </Grid.Box>
              </Grid.Layout>
            </Grid.Box>

            <Grid.Box>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const { label: name, price } = options.find(option => option.value === productValue);
                  const newOrderItem = {
                    product: {
                      id: productValue,
                      name,
                      price,
                    },
                    quantity,
                  };
                  this.addProductToOrder(newOrderItem);
                }}
                disabled={!productValue}
              >
                <Icon name="Plus" />
              </Button>
            </Grid.Box>
          </Grid.Layout>
        </Grid.Box>
      </Grid.Layout>
    );
  }
}

export { OrderItemsField };
