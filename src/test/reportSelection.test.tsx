import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Index from "@/pages/Index";

function chooseSelectOption(triggerTestId: string, value: string) {
  fireEvent.change(screen.getByTestId(triggerTestId), { target: { value } });
}

function openBundleTab() {
  const tab = screen.getByRole("tab", { name: /FHIR IPS Bundle/i });
  fireEvent.pointerDown(tab, { button: 0, buttons: 1, pointerId: 1 });
  fireEvent.mouseDown(tab, { button: 0, buttons: 1 });
  fireEvent.click(tab);
}

describe("report selection pipeline state", () => {
  it("swaps trace rows and terminology artifacts when the source report changes", async () => {
    render(<Index />);

    expect(screen.getByText("T2DM")).toBeInTheDocument();
    expect(screen.getByText("lisinopril 10 mg")).toBeInTheDocument();

    chooseSelectOption("source-report-select", "ind-002");

    await waitFor(() => {
      expect(screen.getByText("sugar disease")).toBeInTheDocument();
      expect(screen.getByText("tab amlodipine 5 mg OD")).toBeInTheDocument();
    });
    expect(screen.queryByText("lisinopril 10 mg")).not.toBeInTheDocument();

    const activeState = screen.getByTestId("active-case-state");
    expect(activeState).toHaveAttribute("data-case-id", "ind-002");
    expect(activeState).toHaveAttribute("data-code-system-id", "local-ind-diabetes-terms");
    expect(activeState).toHaveAttribute("data-bundle-id", "ips-bundle-demo-ind-002");
    expect(activeState).toHaveAttribute("data-source-country", "IND");
  });

  it("uses the source-country control to change the whole active case", async () => {
    render(<Index />);

    expect(screen.getByTestId("source-pdf-card")).toHaveTextContent("US Patient Care Summary");
    expect(screen.getByRole("button", { name: /Download USA source PDF/i })).toBeInTheDocument();

    chooseSelectOption("source-country-select", "AUS");

    await waitFor(() => {
      expect(screen.getByText("T2 diabetes")).toBeInTheDocument();
      expect(screen.getByText("perindopril 4 mg")).toBeInTheDocument();
      expect(screen.getByTestId("source-pdf-card")).toHaveTextContent("AU Patient Summary");
      expect(screen.getByRole("button", { name: /Download AUS source PDF/i })).toBeInTheDocument();
    });
    expect(screen.queryByText("lisinopril 10 mg")).not.toBeInTheDocument();

    const activeState = screen.getByTestId("active-case-state");
    expect(activeState).toHaveAttribute("data-case-id", "aus-003");
    expect(activeState).toHaveAttribute("data-code-system-id", "local-aus-diabetes-terms");
    expect(activeState).toHaveAttribute("data-bundle-id", "ips-bundle-demo-aus-003");
    expect(activeState).toHaveAttribute("data-source-country", "AUS");
  });

  it("shows HL7 FHIR IPS as the interoperability layer between country PDFs", () => {
    render(<Index />);

    const spine = screen.getByTestId("hl7-spine");
    expect(spine).toHaveTextContent("Source country PDF");
    expect(spine).toHaveTextContent("HL7 FHIR IPS document Bundle");
    expect(spine).toHaveTextContent("source of truth");
    expect(spine).toHaveTextContent("Target country PDF");
  });

  it("makes the run action visibly refresh the selected evidence case", () => {
    render(<Index />);

    fireEvent.click(screen.getByRole("button", { name: /run pipeline/i }));

    expect(screen.getByText(/Pipeline refreshed for/i)).toBeInTheDocument();
    expect(screen.getByText("USA · T2DM follow-up (default) → IND")).toBeInTheDocument();
  });

  it("renders a target-specific final receiver report for every destination", async () => {
    render(<Index />);

    openBundleTab();

    await waitFor(() => {
      expect(screen.getByTestId("receiver-report")).toHaveTextContent("Final Indian receiver report");
      expect(screen.getByRole("button", { name: /Download IND PDF/i })).toBeInTheDocument();
    });

    chooseSelectOption("target-country-select", "USA");
    await waitFor(() => {
      expect(screen.getByTestId("receiver-report")).toHaveTextContent("Final US receiver report");
      expect(screen.getByTestId("receiver-report")).toHaveTextContent("US Core / IPS-style receiver");
      expect(screen.getByRole("button", { name: /Download USA PDF/i })).toBeInTheDocument();
    });

    chooseSelectOption("target-country-select", "AUS");
    await waitFor(() => {
      expect(screen.getByTestId("receiver-report")).toHaveTextContent("Final Australian receiver report");
      expect(screen.getByTestId("receiver-report")).toHaveTextContent("AU Base / IPS-style receiver");
      expect(screen.getByRole("button", { name: /Download AUS PDF/i })).toBeInTheDocument();
    });

    chooseSelectOption("target-country-select", "EUR");
    await waitFor(() => {
      expect(screen.getByTestId("receiver-report")).toHaveTextContent("Final European receiver report");
      expect(screen.getByTestId("receiver-report")).toHaveTextContent("EU IPS UV receiver");
      expect(screen.getByRole("button", { name: /Download EUR PDF/i })).toBeInTheDocument();
    });
  });
});
