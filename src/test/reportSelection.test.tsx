import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Index from "@/pages/Index";

function chooseSelectOption(triggerTestId: string, value: string) {
  fireEvent.change(screen.getByTestId(triggerTestId), { target: { value } });
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

    chooseSelectOption("source-country-select", "AUS");

    await waitFor(() => {
      expect(screen.getByText("T2 diabetes")).toBeInTheDocument();
      expect(screen.getByText("perindopril 4 mg")).toBeInTheDocument();
    });
    expect(screen.queryByText("lisinopril 10 mg")).not.toBeInTheDocument();

    const activeState = screen.getByTestId("active-case-state");
    expect(activeState).toHaveAttribute("data-case-id", "aus-003");
    expect(activeState).toHaveAttribute("data-code-system-id", "local-aus-diabetes-terms");
    expect(activeState).toHaveAttribute("data-bundle-id", "ips-bundle-demo-aus-003");
    expect(activeState).toHaveAttribute("data-source-country", "AUS");
  });
});
