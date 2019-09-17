---
title: Simple expense tracking - You are what you spend!
layout: post
date: 2017-02-27 23:30:11 +0100
type: BlogPosting
categories:
- tips
- finance
- others
---

To be a good saver, you must be a good spender.
To have financial stability, you must **spend less than you earn**.
This can be achieved by focusing on your needs, rather than your wants.

The best way to save is to know what you spend, because  **you are what you spend!**.  
Here is a simple tracking method I employ using [LibreOffice Calc](https://en.wikipedia.org/wiki/LibreOffice_Calc) or [Microsoft Excel](https://en.wikipedia.org/wiki/Microsoft_Excel).
The following table simulates a spreadsheet file.
<div class="table-responsive">
<table class="table table-bordered  table-hover table-condensed">
    <thead>
      <tr>
        <th title="A1">Date</th>
        <th title="B">Description</th>
        <th title="C">Currency</th>
				<th title="D"></th>
				<th title="E">Currency(IN)</th>
				<th title="F">Currency(OUT)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td title="2">01/01/2017	</td>
        <td>Payment: Reason</td>
        <td>+1000</td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
      <tr>
        <td title="3">02/01/2017</td>
        <td>Shopping: Reason</td>
        <td>-500</td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
      <tr>
        <td title="4">10/01/2017</td>
        <td>Payment: Reason</td>
        <td>+2000</td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="5">20/01/2017</td>
        <td>Miscellaneous: Reason</td>
        <td>-1000</td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="6">31/01/2017</td>
        <td>Donate: Reason</td>
        <td>-100</td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="7"><b>JANUARY</b></td>
        <td><b>IN</b></td>
        <td title="=SUMIF(C2:C6, '>0')"><b>+3000</b></td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="8"></td>
        <td><b>OUT</b></td>
        <td title="=SUMIF(C2:C6, '<0')"><b>-1600</b></td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="9"></td>
        <td><b>NET</b></td>
        <td title="=(C7+C8)"><b>+1400</b></td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="10"></td>
        <td></td>
        <td></td>
				<td></td>
				<td title="=SUMIF(C2:C6, '>0')"><b>+3000</b></td>
				<td title="=SUMIF(C2:C6, '<0')"><b>-1600</b></td>
      </tr>
			<tr>
        <td title="11">01/02/2017</td>
        <td>Payment: Reason</td>
        <td>+1000</td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="12">02/02/2017</td>
        <td>Shopping: Reason</td>
        <td>-1000</td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="13">10/02/2017</td>
        <td>Payment: Reason</td>
        <td>+5000</td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="14">20/02/2017</td>
        <td>Miscellaneous: Reason</td>
        <td>-1000</td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="15">31/02/2017</td>
        <td>Donate: Reason</td>
        <td>-500</td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="16"><b>FEBRUARY</b></td>
        <td><b>IN</b></td>
        <td title="=SUMIF(C11:C15, '>0')"><b>+6000</b></td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="17"></td>
        <td><b>OUT</b></td>
        <td title="=SUMIF(C11:C15, '<0')"><b>-2500</b></td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="18"></td>
        <td><b>NET</b></td>
        <td title="=(C16+C17)"><b>+3500</b></td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="19"></td>
        <td></td>
        <td></td>
				<td></td>
				<td title="=SUMIF(C11:C15, '>0')"><b>+6000</b></td>
				<td title="=SUMIF(C11:C15, '<0')"><b>-2500</b></td>
      </tr>
			<tr>
        <td title="20"></td>
        <td></td>
        <td></td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
			<tr>
        <td title="21"><b>2017</b></td>
        <td></td>
        <td></td>
				<td></td>
				<td title="=SUM(E2:E19)"><b>+9000</b></td>
				<td title="=SUM(F2:F19)"><b>-4100</b></td>
      </tr>
			<tr>
        <td title="22"></td>
        <td><b>NET</b></td>
        <td title="=SUM(E21:F21)"><b>+4900</b></td>
				<td></td>
				<td></td>
				<td></td>
      </tr>
    </tbody>
  </table>
</div>


At the end of each day, you should add your incomes and expenditures to your expense tracking file. Daily incomes should be positive, while expenditures should have a negative sign. Some people even go as far as painting expenditures in red, just to feel the pain and get them not to spend much.

You can insert a date and time  to the **Date** column with the shortcut  **`Ctrl + ;`**.  The **Description** column takes a short explanation of the income or expenditure, while the **Currency** column takes the actual income or expenditure. The **Currency(IN)** and **Currency(OUT)**  columns hold the monthy total incomes and expenditures respectively. This will be used at the end of the year to calculate the *yearly income*, *yearly outcome*  and *yearly net income*.

You should insert your desired currency in the **Currency** header column. You can also add columns for as many currencies as you want, if you spend and earn in multiple currencies.

At the end of each month, you can track your *total income*, *total expenditures* and *net income* for that month as shown in the simulation table above.

The figures in bold are of special interest.
Hover over them to see their corresponding formulae.

`=SUMIF(C2:C6, ">0")` *Sums the figures from Columns 2 to 6 if they are positive -* **Incomes**  
`=SUMIF(C2:C6, "<0")` *Sums the figures from Columns 2 to 6 if they are negative -* **Expenditures**  

**Happy Tracking!**
