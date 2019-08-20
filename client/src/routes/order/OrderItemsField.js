import React from 'react';

import { Grid, Heading, Button, Select, Input, Icon, Label } from '@8base/boost';

class OrderItemsField extends React.PureComponent {
  render() {
    const {
      input: { value, onChange },
      productOptions,
      displayLabel,
      deleteOrderItem,
    } = this.props;

    if (!value) {
      return null;
    }

    const {
      product: { id: productId, price },
      quantity,
    } = value;

    const totalCost = Math.round(price * quantity * 100) / 100;

    return (
      <Grid.Layout gap="md" inline columns="2fr 1fr 1fr 1fr 50px" alignItems="end">
        <Grid.Box>
          <Grid.Layout>
            {displayLabel && (
              <Grid.Box>
                <Label text="Product name" kind="secondary" />
              </Grid.Box>
            )}
            <Grid.Box>
              <Select
                name="productName"
                placeholder="Select an option"
                options={productOptions}
                value={productId}
                onChange={productId => {
                  const { value: id, label: name, price } = productOptions.find(product => product.value === productId);
                  console.log({ value: id, label: name, price });
                  onChange({
                    ...value,
                    product: {
                      id,
                      name,
                      price,
                    },
                    id: 0,
                  });
                }}
              />
            </Grid.Box>
          </Grid.Layout>
        </Grid.Box>
        <Grid.Box>
          <Grid.Layout>
            {displayLabel && (
              <Grid.Box>
                <Label text="Price" kind="secondary" />
              </Grid.Box>
            )}
            <Grid.Box>
              <Input
                name="productPrice"
                type="number"
                value={price}
                onChange={quantity => this.setState({ quantity })}
                min={0}
                disabled
              />
            </Grid.Box>
          </Grid.Layout>
        </Grid.Box>
        <Grid.Box>
          <Grid.Layout>
            {displayLabel && (
              <Grid.Box>
                <Label text="Quantity" kind="secondary" />
              </Grid.Box>
            )}
            <Grid.Box>
              <Input
                name="productQuantity"
                type="number"
                value={quantity}
                onChange={quantity => onChange({ ...value, quantity, id: 0 })}
                min={1}
              />
            </Grid.Box>
          </Grid.Layout>
        </Grid.Box>

        <Grid.Box>
          <Grid.Layout>
            {displayLabel && (
              <Grid.Box>
                <Label text="Total" kind="secondary" />
              </Grid.Box>
            )}
            <Grid.Box>
              <Input name="totalCost" type="number" value={totalCost} min={0} disabled />
            </Grid.Box>
          </Grid.Layout>
        </Grid.Box>

        <Grid.Box>
          <Button type="button" size="sm" onClick={deleteOrderItem}>
            <Icon name="Delete" />
          </Button>
        </Grid.Box>
      </Grid.Layout>
    );
  }
}

export { OrderItemsField };
