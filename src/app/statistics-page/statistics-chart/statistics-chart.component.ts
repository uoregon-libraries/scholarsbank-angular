import {
  AsyncPipe,
  NgFor,
  NgIf,
  TitleCasePipe,
  DatePipe,
} from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {
  Observable,
  of,
  Subscription,
  forkJoin,
} from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Chart,
  ChartConfiguration,
  ChartOptions,
  registerables
} from 'chart.js';
Chart.register(...registerables);
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';

import * as historyOffsets from '../../../assets/js/historyoffsets.json';
import * as countrycodes from '../../../assets/js/country-codes.json';

import { DSONameService } from '../../core/breadcrumbs/dso-name.service';
import { DSpaceObjectDataService } from '../../core/data/dspace-object-data.service';
import { DSpaceObject } from '../../core/shared/dspace-object.model';
import { ItemDataService } from '../../core/data/item-data.service';
import { Item } from '../../core/shared/item.model';
import { RemoteData } from 'src/app/core/data/remote-data';

import {
  getFinishedRemoteData,
  getRemoteDataPayload,
  getFirstCompletedRemoteData,
} from '../../core/shared/operators';
import {
  Point,
  UsageReport,
} from '../../core/statistics/models/usage-report.model';
import { isEmpty } from '../../shared/empty.util';
import { ThemedLoadingComponent } from '../../shared/loading/themed-loading.component';
import { RouterLink } from '@angular/router';

export interface TableViewData {
  title: string;
  views: number;
}

/**
 * Component representing a statistics chart for a given usage report.
 */
@Component({
  selector: 'ds-statistics-chart',
  templateUrl: './statistics-chart.component.html',
  styleUrls: ['./statistics-chart.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe, TitleCasePipe, TranslateModule, ThemedLoadingComponent, RouterLink],
})

export class StatisticsChartComponent implements OnInit, AfterViewInit, OnDestroy {
  /**
   * The usage report to display a statistics chart for
   */
  @Input()
  reports: UsageReport[];
  /**
   * The scope of the current statistics page
   */
  @Input()
  scope: any;

  /**
   * Boolean indicating whether the usage report has data
   */
  hasData: boolean;

  /**
   * The chart headers
   */
  headers: string[];

  private offsets: any = (historyOffsets as any).default;

  constructor(
    protected dsoService: DSpaceObjectDataService,
    protected nameService: DSONameService,
    private translateService: TranslateService,
    protected http: HttpClient,
    private itemService: ItemDataService,
    private cdr: ChangeDetectorRef,
  ) {

  }

  /**
   * Helper function to format numbers in chart labels
   */
  public formatNumber(value: number | string, separator: string = ','): string {
    if (typeof value === 'string' && value.length === 0) {
      return "";
    }
    if (typeof value === 'undefined') {
      return "0";
    }
    return value.toString();
  }

  /**
   * Helper function to get color codes for choropleth maps
   */
  private getColor(d: number): string {
    return d > 1000 ? '#800026' :
      d > 500 ? '#BD0026' :
        d > 200 ? '#E31A1C' :
          d > 100 ? '#FC4E2A' :
            d > 50 ? '#FD8D3C' :
              d > 20 ? '#FEB24C' :
                d > 10 ? '#FED976' : '#FFEDA0';
  }

  get countryTableData() {
    const codenames = this.codenamepairs;
    const entries = Object.entries(this.countryData);
    const len = entries.length;
    const rows = [];

    for (let i = 0; i < entries.length; i += 2) {
      if (i + 1 < len) {
        let c1 = entries[i][0];
        let d1 = entries[i][1];
        let c2 = entries[i + 1][0];
        let d2 = entries[i + 1][1];
        if (typeof (codenames[c1] !== 'undefined')) {
          c1 = codenames[c1];
        }
        if (typeof (codenames[c2] !== 'undefined')) {
          c2 = codenames[c2];
        }
        rows.push({
          country1: c1,
          downloads1: d1,
          country2: c2,
          downloads2: d2
        });
      } else {
        let c1 = entries[i][0];
        let d1 = entries[i][1];
        const c2 = '';
        const d2 = '';
        if (typeof (codenames[c1] !== 'undefined')) {
          c1 = codenames[c1];
          rows.push({
            country1: c1,
            downloads1: d1,
            country2: c2,
            downloads2: d2
          });
        }
      }
    }
    return rows;
  }

  ngOnInit() {
    if (this.scope.type === 'site') {
      this.loadDataTb1(this.scope);
      this.initSiteCountryDownloads(this.scope).then(() => this.loadCountryData());
      this.loadAllItemCount();
    } else if (this.scope.type === 'community' || this.scope.type === 'collection') {
      // this.initSiteCountryDownloads(this.scope).then(() => this.useCountrydata());
      this.loadReports();
      this.loadCountryData();
    } else if (this.scope.type === 'item') {
      this.loadReports();
      this.loadCountryData();
    }
  }

  ngAfterViewInit(): void {
    if (this.scope.type === 'site') {
      // Load data and initialize the chart only after the view is ready
      this.loadData(this.scope).then(() => this.initializeChartViews());
      // this.loadDataFromFilesSite().then(() => this.initializeChartViews());
      this.loadDataForDoughnut(this.scope).then(() => this.initViewDownloadChart());
      this.initMap();
    } else if (this.scope.type === 'community' || this.scope.type === 'collection') {
      // this.loadDataFromFiles(this.scope).then(() => this.initializeChart2());
      this.initViewDownloadChart();
      this.initializeChartViews();
      this.initMap();
    } else if (this.scope.type === 'item') {
      this.initViewDownloadChart();
      this.initializeChartViews();
      this.initMap();
    }
    this.initCountryCodeNames().then(() => this.countryTableData);
  }

  ngOnDestroy(): void {
    Chart.getChart('chartDoughnut')?.destroy()
    Chart.getChart('myChart')?.destroy()
    this.map?.remove();
    this.dataSubscription1?.unsubscribe();
    this.dataSubscriptionMap?.unsubscribe();
    this.dataSubscriptionMap1?.unsubscribe();
    this.dataSubscription3?.unsubscribe();
    this.dataSubscriptionTb1?.unsubscribe();
  }

  /**
   * Initialize charts, maps, and data
   */
  private chartPieTotal: Chart | null = null;
  private chartLineMonthly: Chart | null = null;
  public chartType: ChartConfiguration['type'];
  public chartTotalData: number[] = [];
  public chartMonthlyLabels: string[] = [];
  public chartMonthlyViewData: number[] = [];
  public chartMonthlyDownloadData: number[] = [];

  private map: any;
  private dataSubscriptionMap: Subscription | null = null;
  private geoJsonData: any;
  public countryData = {};
  public countryCodeName = {};
  private codenamepairs: any = (countrycodes as any).default;

  public topItemsLabels: string[] = [];
  public topItemsViews: number[] = [];
  public topItemsIds: string[] = [];

  /**
   * CHART DATA
   */
  /**
   * Chart Data from UsageReports
   */
  private loadReports() {
    this.reports.forEach((report) => {
      switch (report.reportType) {
        case 'TotalVisits':
          this.hasData = report.points.length > 0;
          if (this.hasData) {
            this.chartTotalData.push(report.points[0].values['views']);
          }
          break;
        case 'TotalVisitsItems':
          this.hasData = report.points.length > 0;
          if (this.hasData) {
            this.chartTotalData.push(report.points[0].values['views']);
          }
          break;
        case 'TotalDownloads':
          this.hasData = report.points.length > 0;
          if (this.hasData) {
            let sumofdownloads: number = 0;
            report.points.forEach((point) => {
              sumofdownloads += point.values['views'];
            })
            this.chartTotalData.push(sumofdownloads);
          }
          break;
        case 'TotalDownloadsBitstreams':
          this.hasData = report.points.length > 0;
          if (this.hasData) {
            let sumofdownloads: number = 0;
            report.points.forEach((point) => {
              sumofdownloads += point.values['views'];
            })
            this.chartTotalData.push(sumofdownloads);
          }
          break;
        case 'TotalVisitsPerMonth':
          this.hasData = report.points.length > 0;
          if (this.hasData) {
            report.points.forEach((point) => {
              this.chartMonthlyLabels.push(point.label);
              this.chartMonthlyViewData.push(point.values['views']);
            })
          }
          break;
        case 'TotalDownloadsPerMonth':
          this.hasData = report.points.length > 0;
          if (this.hasData) {
            report.points.forEach((point) => {
              this.chartMonthlyDownloadData.push(point.values['views']);
            })
          }
          break;
        case 'TopCountries':
          this.hasData = report.points.length > 0;
          if (this.hasData) {
            report.points.forEach((point) => {
              this.countryData[point.id] = point.values['views'];
            })
          }
          break;
        case 'TopItems':
          this.hasData = report.points.length > 0;
          if (this.hasData) {
            report.points.forEach((point) => {
              this.topItemsLabels.push(point.label);
              this.topItemsViews.push(point.values['views']);
              this.topItemsIds.push(point.id);
            })
          }
        default:
          this.chartType = 'line';
      }
    })
  }

  /**
   * MAP DATA
   */

  private initMap(): void {
    this.map = L.map('map', {
      center: [42.8, -10.5],
      zoom: 2
    });

    // Add a tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Handle resize events
    window.addEventListener('resize', () => {
      this.map.invalidateSize();
    });
  }

  /**
   * Load geographic data for maps
   */
  loadCountryData() {
    // Load GeoJSON data and apply it to the map
    this.http.get('assets/js/countries.geojson').subscribe((geoJsonData: any) => {
      this.createChoroplethLayer(geoJsonData);
      this.geoJsonData = geoJsonData;
    });
  }

  private async initCountryCodeNames(): Promise<void> {
    const dataFile = '/assets/js/countries.geojson';

    return new Promise((resolve) => {
      this.dataSubscriptionMap = this.http.get<any>(dataFile)
        .subscribe(response => {
          if (response.features) {
            const countries = response.features;
            countries.forEach((country) => {
              this.countryCodeName[country.properties.ISO_A2] = country.properties.ADMIN;
            })
          }
          resolve();
        });
    });
  }

  private createChoroplethLayer(geoJsonData: any): void {
    L.geoJSON(geoJsonData, {
      style: (feature) => this.style(feature),
      onEachFeature: (feature, layer) => this.onEachFeature(feature, layer)
    }).addTo(this.map);
  }

  /**
   * Helper fuction to style choropleth maps
   */
  private style(feature: any): any {
    const countryCode = feature.properties.ISO_A2;  // Match country code
    const viewCounts = this.countryData[countryCode];

    return {
      fillColor: this.getColor(viewCounts),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  }

  // Bind popups for each feature
  private onEachFeature(feature: any, layer: any): void {
    const countryCode = feature.properties.ISO_A2;
    const viewCounts = this.countryData[countryCode];
    if (this.scope.type === 'site') {
      layer.bindPopup(`<strong>${feature.properties.ADMIN}</strong><br>Downloads: ${this.formatNumber(viewCounts)}`);
    } else {
      layer.bindPopup(`<strong>${feature.properties.ADMIN}</strong><br>Page views: ${this.formatNumber(viewCounts)}`);
    }
  }

  /**
   * DATA FROM EXTERNAL JSON FILES
   */
  public allItemCount = 0;

  private loadAllItemCount(): void {
    const dataFile = '/assets/data/all-item-count.json';
    this.http.get<any>(dataFile).subscribe(response => {
      this.allItemCount = response.response.numFound;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  public itempageviews: TableViewData[] = [];
  public itemdownloads: TableViewData[] = [];
  private dataSubscriptionTb1: Subscription | null = null;
  public loading = true;

  private loadDataTb1(scope: any): void {
    let dataFiles = [];
    if (scope.type === 'site') {
      dataFiles = [
        'assets/data/site-top10-item-pageviews.json',
        'assets/data/site-top10-item-downloads.json'
      ];
    }

    let itemviews1: TableViewData[] = [];
    let itemviews2: TableViewData[] = [];
    let sortedItems: TableViewData[] = [];
    let itemdownloads1: TableViewData[] = [];
    let itemdownloads2: TableViewData[] = [];
    let sortedDownloads: TableViewData[] = [];

    this.dataSubscriptionTb1 = forkJoin(
      dataFiles.map(file => this.http.get<any>(file))
    ).subscribe(responses => {
      responses.forEach((response, index) => {
        switch (index) {
          case 0: // site-top10-item-pageviews.json
            if (response.facet_counts && response.facet_counts.facet_fields && response.facet_counts.facet_fields.id) {
              itemviews1 = this.transformArray(response.facet_counts.facet_fields.id);
            }
            if (this.offsets.exceptionComCols.includes(scope.id)) {
              const pageviews = this.offsets.top10ItemViewDownloads[scope.id]["ItemId"];
              itemviews2 = this.transformArray(pageviews);
            }
            sortedItems = [...itemviews1, ...itemviews2]
              .sort((a, b) => b.views - a.views)
              .slice(0, 10);
            this.itempageviews = sortedItems;
            this.loading = false;
            this.cdr.detectChanges();

            break;

          case 1: // site-top10-item-downloads.json
            if (response.facet_counts && response.facet_counts.facet_fields && response.facet_counts.facet_fields.owningItem) {
              itemdownloads1 = this.transformArray(response.facet_counts.facet_fields.owningItem);
            }
            if (this.offsets.exceptionComCols.includes(scope.id)) {
              const downloads = this.offsets.top10ItemViewDownloads[scope.id]["owningItem"];
              itemdownloads2 = this.transformArray(downloads);
            }
            sortedDownloads = [...itemdownloads1, ...itemdownloads2]
              .sort((a, b) => b.views - a.views)
              .slice(0, 10);
            this.itemdownloads = sortedDownloads;
            this.loading = false;
            this.cdr.detectChanges();

            break;

          default:
            console.warn('Unexpected file structure');
        }
      });
    });
  }

  private dataSubscription3: Subscription | null = null;

  private async loadDataForDoughnut(scope: any): Promise<void> {
    let dataFiles = [];
    if (scope.type === 'site') {
      dataFiles = [
        'assets/data/site-pageviews.json',
        'assets/data/site-downloads.json',
      ];
    }

    return new Promise((resolve) => {
      this.dataSubscription3 = forkJoin(
        dataFiles.map(file => this.http.get<any>(file))
      ).subscribe(responses => {
        responses.forEach((response, index) => {
          switch (index) {
            case 0: // pageviews
              if (scope.type === 'site') {
                if (response.response && response.response.numFound) {
                  this.chartTotalData.push(response.response.numFound);
                }
              }
              break;

            case 1: // downloads
              if (scope.type === 'site') {
                if (response.response && response.response.numFound) {
                  this.chartTotalData.push(response.response.numFound);
                }
              }

            default:
              console.warn('Unexpected file structure');
          }
        });
        resolve();
      });
    });

  }

  private dataSubscription1: Subscription | null = null;

  private async loadData(scope: any): Promise<void> {
    let dataFiles = [];
    if (scope.type === 'site') {
      dataFiles = [
        'assets/data/site-pageviews-6months.json',
        'assets/data/site-downloads-6months.json'
      ];
    }

    return new Promise((resolve) => {
      this.dataSubscription1 = forkJoin(
        dataFiles.map(file => this.http.get<any>(file))
      ).subscribe(responses => {
        responses.forEach((response, index) => {
          switch (index) {
            case 0: // pageviews-6months.json
              if (scope.type === 'site') {
                if (response.facet_counts && response.facet_counts.facet_ranges && response.facet_counts.facet_ranges.time && response.facet_counts.facet_ranges.time.counts) {
                  const counts = response.facet_counts.facet_ranges.time.counts;
                  for (let i = 0; i < counts.length; i += 2) {
                    this.chartMonthlyLabels.push(this.convertMonth(counts[i]));
                    this.chartMonthlyViewData.push(counts[i + 1]);
                  }
                }
              }
              break;

            case 1: // downloads-6months.json
              if (scope.type === 'site') {
                if (response.facet_counts && response.facet_counts.facet_ranges && response.facet_counts.facet_ranges.time && response.facet_counts.facet_ranges.time.counts) {
                  const counts = response.facet_counts.facet_ranges.time.counts;
                  for (let i = 0; i < counts.length; i += 2) {
                    this.chartMonthlyDownloadData.push(counts[i + 1]);
                  }
                }
              }
              break;

            default:
              console.warn('Unexpected file structure');
          }
        });
        resolve();
      });
    });
  }

  private dataSubscriptionMap1: Subscription | null = null;

  private async initSiteCountryDownloads(scope: any): Promise<void> {
    let dataFile = '';
    if (scope.type === 'site') {
      dataFile = '/assets/data/site-country-downloads.json';
    }

    return new Promise((resolve) => {
      this.dataSubscriptionMap1 = this.http.get<any>(dataFile)
        .subscribe(response => {
          if (response.facet_counts && response.facet_counts.facet_fields && response.facet_counts.facet_fields.countryCode) {
            const countryCode = response.facet_counts.facet_fields.countryCode;
            for (let i = 0; i < countryCode.length; i += 2) {
              this.countryData[countryCode[i]] = countryCode[i + 1];
            }
          }

          if (this.offsets.exceptionComCols.includes(scope.id)) {
            const downloads = this.offsets.countryDownloads[scope.id];
            for (let i = 0; i < downloads.length; i += 2) {
              if (this.countryData[downloads[i]]) {
                this.countryData[downloads[i]] = this.countryData[downloads[i]] + downloads[i + 1];
              } else {
                this.countryData[downloads[i]] = downloads[i + 1];
              }
            }
          }
          resolve();
        });
    });
  }


  getValueById(uuid: string, owningCommMap: { [key: string]: number }): number | undefined {
    if (Number.isNaN(owningCommMap[uuid]) || typeof (owningCommMap[uuid]) === 'undefined') {
      return 0;
    }
    return owningCommMap[uuid];
  }

  convertArray(owningFields: any) {
    let owningCommCollMap = {};
    let owningComm = [];
    let owningColl = [];

    if (owningFields.owningComm) {
      owningComm = owningFields.owningComm;
    }
    if (owningFields.owningColl) {
      owningColl = owningFields.owningColl;
    }

    for (let i = 0; i < owningComm.length; i += 2) {
      const id = owningComm[i];
      const value = owningComm[i + 1];
      owningCommCollMap[id] = value;
    }

    for (let j = 0; j < owningColl.length; j += 2) {
      const id = owningColl[j];
      const value = owningColl[j + 1];
      owningCommCollMap[id] = value;
    }

    return owningCommCollMap;
  }

  convertMonth(datestr: string) {
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(datestr, 'MMM yyyy', 'UTC') || '';
  }

  private transformArray(data: (string | number)[]): TableViewData[] {
    const transformed: TableViewData[] = [];
    for (let i = 0; i < data.length; i += 2) {
      if (typeof data[i] === 'string' && typeof data[i + 1] === 'number') {
        transformed.push({ title: data[i] as string, views: data[i + 1] as number });
      }
    }
    return transformed;
  }

  getLabel(uuid: string): Observable<string> {
    return this.dsoService.findById(uuid).pipe(
      getFinishedRemoteData(),
      getRemoteDataPayload(),
      map((item) => !isEmpty(item) ? this.nameService.getName(item) : this.translateService.instant('statistics.chart.no-name')),
    );
  }

  public truncateString(str, maxLength) {
    if (str !== null && str.length > maxLength) {
      return str.slice(0, maxLength) + "...";
    } else {
      return str;
    }
  }

  getItem(uuid: string): Observable<DSpaceObject> {
    return this.itemService.findById(uuid).pipe(
      getFirstCompletedRemoteData(),
      map((rd: RemoteData<Item>) => {
        if (rd.hasSucceeded) {
          return rd.payload;
        }
        throw new Error(rd.errorMessage);
      })
    );
  }

  /**
   * CHARTS
   */

  /**
   * View/Download Doughnut Chart
   */
  private initViewDownloadChart(): void {
    const chartConfig: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Page Views', 'Downloads'],
        datasets: [{
          label: 'Aggregated Dataset',
          data: this.chartTotalData,
          backgroundColor: [
            'rgba(13, 150, 142, 0.2)',  // color for pageviews
            'rgba(255, 99, 132, 0.2)'   // color for downloads
          ],
          borderColor: [
            'rgba(13, 150, 142, 1)',    // border color for pageviews
            'rgba(255, 99, 132, 1)'     // border color for downloads
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              generateLabels: (chart) => {
                const datasets = chart.data.datasets;
                return datasets[0].data.map((data, i) => ({
                  text: `${chart.data.labels[i]}: ${data}`,
                  fillStyle: datasets[0].backgroundColor[i],
                  index: i
                }))
              },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          title: {
            display: true,
            text: 'Total page views and downloads'
          }
        }
      }
    };

    // Initialize the chart on the canvas element
    const ctx3 = document.getElementById('chartDoughnut') as HTMLCanvasElement;
    if (ctx3) {
      this.chartPieTotal = new Chart(ctx3, chartConfig);
    }
  }

  private initializeChartViews(): void {
    const chartConfig: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.chartMonthlyLabels,
        datasets: [{
          label: 'Page views',
          data: this.chartMonthlyViewData,
          tension: 0.1,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Downloads',
          data: this.chartMonthlyDownloadData,
          tension: 0.1,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255,99,132,1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Page views and downloads over 6 Months'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    // Set up the chart after data loading
    const ctx = document.getElementById('myChart') as HTMLCanvasElement;
    if (ctx) {
      this.chartLineMonthly = new Chart(ctx, chartConfig);
    }
  }

  /**
   * Get the name of the scope dso.
   * @param scope the scope dso to get the name for
   */
  getName(scope: DSpaceObject): string {
    return this.nameService.getName(scope);
  }

}
