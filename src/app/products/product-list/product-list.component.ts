import { Component, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ColDef, GridOptions, RowDoubleClickedEvent } from 'ag-grid-community';
import { filter, switchMap } from 'rxjs';
import { ProductDetailComponent } from '../product-detail/product-detail.component';
import { Product, ProductHttpService } from '../product-http.service';
import { ProductService } from '../product.service';

@Component({
  selector: 'y42-product-list',
  template: `
    <button class="add-button" mat-raised-button color="primary" (click)="openWindow()">Add new product</button>
    <ag-grid-angular
        class="ag-theme-alpine"
        [rowData]="products$ | async"
        [gridOptions]="gridOptions"
        [columnDefs]="columnDefs"
        (rowDoubleClicked)="openProduct($event)"
    ></ag-grid-angular>
    <mat-spinner *ngIf="loading$ | async" [diameter]="36" [mode]="'indeterminate'"></mat-spinner> `,
  styleUrls: ['./product-list.styles.scss']
})
export class ProductListComponent implements OnInit {
  constructor(
      private productService: ProductService,
      private bottomSheet: MatBottomSheet,
      private productHttpService: ProductHttpService) {}

  readonly products$ = this.productService.products$;
  readonly loading$ = this.productService.loading$;

  readonly gridOptions: GridOptions<Product> = {
    suppressCellFocus: true,
    animateRows: true,
    stopEditingWhenCellsLoseFocus: true,
    defaultColDef: {
      minWidth: 150,
      sortable: true,
      resizable: true,
    },
  };
  readonly columnDefs: Array<ColDef<Product>> = [
    {
      headerName: 'Title',
      field: 'title',
      sort: 'asc',
      filter: 'title'
    },
    {
      headerName: 'Brand',
      field: 'brand',
      filter: 'brand'
    },
    {
      headerName: 'Description',
      field: 'description',
      filter: 'description'
    },
    {
      headerName: 'Stock',
      field: 'stock',
      filter: 'stock',
      valueFormatter: (params) => Intl.NumberFormat(undefined).format(params.value),
      editable: true,
      onCellValueChanged: (params) => {
        const data: Product = params.data;
        const newStock: string = params.newValue;
        this.productService.updateStock(data.id, Number(newStock)).subscribe();
      },
      cellStyle: {
        'border-left': '1px dashed #ddd',
        'border-bottom': '1px dashed #ddd',
      },
    },
    {
      headerName: 'Price',
      field: 'price',
      filter: 'price',
      editable: true,
      valueFormatter: (params) =>
        Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(params.value),
      onCellValueChanged: (params) => {
        const data: Product = params.data;
        const newPrice: string = params.newValue;
        this.productService.updatePrice(data.id, Number(newPrice)).subscribe();
      },
      cellStyle: {
        'border-left': '1px dashed #ddd',
        'border-bottom': '1px dashed #ddd',
      },
    },
    {
      headerName: 'Rating',
      field: 'rating',
      filter: 'rating',
      valueFormatter: (params) => `${(params.value as number).toFixed(2)}/5`,
    },
  ];

  ngOnInit(): void {
    this.productService.getAll().subscribe();
  }

  openProduct(params: RowDoubleClickedEvent<Product>): void {
    if (!params.data) {
      return;
    }

    const target = params.event?.target as HTMLElement;
    if (target.classList.contains('ag-cell-inline-editing')) {
      return;
    }

    const product: Product = params.data;
    const id = product.id;
    this.bottomSheet
      .open<ProductDetailComponent, Product, Product>(ProductDetailComponent, { data: product })
      .afterDismissed()
      .pipe(
        filter(Boolean),
        switchMap((newProduct) => this.productService.updateProduct(id, newProduct)),
      )
      .subscribe();
  }

  openWindow() {
    this.bottomSheet
        .open<ProductDetailComponent, Product, Product>(ProductDetailComponent, {})
        .afterDismissed()
        .pipe(
            filter(Boolean),
            switchMap((newProduct: Product) => this.productHttpService.addProduct(newProduct)),
        )
        .subscribe((newProduct: Product) => {
          this.productService.updateProductList(newProduct)
        });
  }
}
