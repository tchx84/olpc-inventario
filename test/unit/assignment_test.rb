require 'test_helper'

class AssignmentTest < ActiveSupport::TestCase
  test "can't delete person with laptop assigned" do
    # Found about 250 laptops in the Nicaragua production db, assigned to
    # a non-existant person.
    l = default_person.laptops.create!(:serial_number => "SHC12345678")

    assignee = Person.create!(:name => "Assignee", :id_document => "assignee")
    Assignment.register(:serial_number_laptop => "SHC12345678", :id_document => assignee.id_document)
    assert_raise(ActiveRecord::StatementInvalid) { assignee.destroy }
  end
end